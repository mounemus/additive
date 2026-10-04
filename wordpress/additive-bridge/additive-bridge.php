<?php
/**
 * Plugin Name: Additive — Passerelle Vercel
 * Description: Pilote le site Additive hébergé sur Vercel depuis WordPress : redirection 301 du sous-site, synchronisation des commandes (→ WooCommerce) et des messages de contact, statuts renvoyés à Vercel.
 * Version: 1.1.0
 * Author: Additive
 * Requires PHP: 7.4
 */

defined( 'ABSPATH' ) || exit;

const ADDB_OPT   = 'addb_settings';
const ADDB_CRON  = 'addb_sync_event';
const ADDB_META  = '_additive_vercel_id';
const ADDB_CPT   = 'additive_contact';

/* ------------------------------------------------------------------ */
/* Réglages                                                            */
/* ------------------------------------------------------------------ */

function addb_opt( $key ) {
	$o = wp_parse_args( get_option( ADDB_OPT, array() ), array(
		'url'      => 'https://additive-blue.vercel.app',
		'secret'   => '',
		'redirect' => 1,
	) );
	return $o[ $key ];
}

function addb_url( $path = '' ) {
	return untrailingslashit( addb_opt( 'url' ) ) . $path;
}

/* ------------------------------------------------------------------ */
/* 1. Redirection 301 du front                                         */
/* ------------------------------------------------------------------ */

function addb_redirect_map( $path ) {
	$path = '/' . trim( $path, '/' );

	if ( preg_match( '#^/produit/lunettes-personnalisees-additive$#', $path ) ) {
		return '/personnalisation';
	}
	if ( preg_match( '#^/(?:produit|product)/([^/]+)$#', $path, $m ) ) {
		return '/produits/' . $m[1];
	}
	if ( preg_match( '#^/(?:categorie-produit|product-category)/(?:.*/)?([^/]+)$#', $path, $m ) ) {
		$cat = in_array( $m[1], array( 'cyborg', 'cygnus', 'eclipso' ), true ) ? 'modulair' : $m[1];
		return in_array( $cat, array( 'modulair', 'generative', 'hybride' ), true ) ? '/collections/' . $cat : '/collections';
	}

	$pages = array(
		'/shop'       => '/produits',
		'/boutique'   => '/produits',
		'/collection' => '/collections',
		'/cart'       => '/cart',
		'/panier'     => '/cart',
		'/my-account' => '/account',
		'/about'      => '/about',
		'/contact'    => '/contact',
		'/contact-2'  => '/contact',
	);
	return isset( $pages[ $path ] ) ? $pages[ $path ] : '/';
}

add_action( 'template_redirect', function () {
	if ( ! addb_opt( 'redirect' ) || is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}
	// Les administrateurs connectés voient encore le WordPress (vérifications).
	if ( current_user_can( 'manage_options' ) ) {
		return;
	}
	$home = rtrim( (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH ), '/' );
	$path = (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '/', PHP_URL_PATH );
	if ( $home !== '' && strpos( $path, $home ) === 0 ) {
		$path = substr( $path, strlen( $home ) );
	}
	nocache_headers();
	wp_redirect( addb_url( addb_redirect_map( $path ) ), 301, 'Additive' );
	exit;
}, 0 );

/* ------------------------------------------------------------------ */
/* 2. API Vercel                                                       */
/* ------------------------------------------------------------------ */

function addb_api( $method, $body = null ) {
	$secret = addb_opt( 'secret' );
	if ( ! $secret ) {
		return new WP_Error( 'addb_no_secret', 'Clé de synchronisation non configurée.' );
	}
	$args = array(
		'method'  => $method,
		'timeout' => 20,
		'headers' => array( 'Authorization' => 'Bearer ' . $secret, 'Content-Type' => 'application/json' ),
	);
	if ( null !== $body ) {
		$args['body'] = wp_json_encode( $body );
	}
	$res  = wp_remote_request( addb_url( '/api/integrations/wordpress' ), $args );
	if ( is_wp_error( $res ) ) {
		return $res;
	}
	$code = wp_remote_retrieve_response_code( $res );
	$json = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( $code >= 300 ) {
		return new WP_Error( 'addb_http', 'Vercel a répondu HTTP ' . $code . ( isset( $json['error'] ) ? ' (' . $json['error'] . ')' : '' ) );
	}
	return $json;
}

/** Statut Vercel → WooCommerce, et l'inverse. */
function addb_status_to_wc( $s ) {
	$map = array(
		'pending_payment' => 'pending',
		'paid'            => 'processing',
		'new'             => 'on-hold',
		'in_progress'     => 'processing',
		'answered'        => 'completed',
		'archived'        => 'cancelled',
	);
	return isset( $map[ $s ] ) ? $map[ $s ] : 'on-hold';
}

function addb_status_from_wc( $s ) {
	$map = array(
		'pending'    => 'pending_payment',
		'on-hold'    => 'new',
		'processing' => 'in_progress',
		'completed'  => 'answered',
		'cancelled'  => 'archived',
		'refunded'   => 'archived',
		'failed'     => 'archived',
	);
	return isset( $map[ $s ] ) ? $map[ $s ] : null;
}

/* ------------------------------------------------------------------ */
/* 3. Synchronisation                                                  */
/* ------------------------------------------------------------------ */

$GLOBALS['addb_syncing'] = false; // évite de renvoyer à Vercel ce qui vient de Vercel

function addb_sync() {
	$data = addb_api( 'GET' );
	if ( is_wp_error( $data ) ) {
		update_option( 'addb_last_sync', array( 'time' => time(), 'error' => $data->get_error_message() ), false );
		return $data;
	}

	$GLOBALS['addb_syncing'] = true;
	$new_orders = 0;
	$new_contacts = 0;

	foreach ( (array) $data['orders'] as $o ) {
		$new_orders += addb_upsert_order( $o ) ? 1 : 0;
	}
	foreach ( (array) $data['contacts'] as $c ) {
		$new_contacts += addb_upsert_contact( $c ) ? 1 : 0;
	}
	$GLOBALS['addb_syncing'] = false;

	$result = array(
		'time'         => time(),
		'new_orders'   => $new_orders,
		'new_contacts' => $new_contacts,
		'stats'        => isset( $data['stats'] ) ? $data['stats'] : array(),
		'total_orders' => count( (array) $data['orders'] ),
		'total_contacts' => count( (array) $data['contacts'] ),
	);
	update_option( 'addb_last_sync', $result, false );
	return $result;
}

/** Retourne true si la commande a été créée. */
function addb_upsert_order( $o ) {
	if ( ! function_exists( 'wc_create_order' ) || empty( $o['id'] ) ) {
		return false;
	}
	// Correspondance id Vercel → id commande dans une option : marche avec ou sans HPOS.
	$map   = get_option( 'addb_order_map', array() );
	$order = isset( $map[ $o['id'] ] ) ? wc_get_order( $map[ $o['id'] ] ) : false;

	if ( $order ) {
		// Seule transition automatique côté Vercel : paiement de l'acompte confirmé.
		if ( 'paid' === $o['status'] && 'pending' === $order->get_status() ) {
			$order->update_status( 'processing', 'Acompte payé (Stripe, site Vercel).' );
		}
		return false;
	}

	$order = wc_create_order();
	$name  = trim( (string) $o['name'] );
	$parts = explode( ' ', $name, 2 );

	$item = new WC_Order_Item_Fee();
	$item->set_name( sprintf( 'Monture sur mesure « %s »', $o['conceptLabel'] ? $o['conceptLabel'] : 'Additive' ) );
	$item->set_total( (float) $o['estimatedPrice'] );
	$item->set_tax_status( 'none' );
	$order->add_item( $item );

	$order->set_billing_first_name( $parts[0] );
	$order->set_billing_last_name( isset( $parts[1] ) ? $parts[1] : '' );
	$order->set_billing_email( (string) $o['email'] );
	$order->set_billing_phone( (string) $o['phone'] );
	$order->set_currency( $o['currency'] ? $o['currency'] : 'CAD' );
	$order->set_created_via( 'additive-vercel' );
	$order->set_date_created( strtotime( $o['createdAt'] ) );
	$order->update_meta_data( ADDB_META, $o['id'] );

	$details = array(
		'Concept'        => $o['conceptLabel'],
		'Résumé'         => $o['conceptSummary'],
		'Audace'         => $o['boldness'],
		'Forme du visage'=> $o['faceShape'],
		'Styles'         => implode( ', ', (array) $o['styleTags'] ),
		'Correspondance' => $o['matchRate'] ? $o['matchRate'] . ' %' : '',
		'Options'        => $o['options'] ? wp_json_encode( $o['options'], JSON_UNESCAPED_UNICODE ) : '',
		'Mesures (mm)'   => $o['measurements'] ? wp_json_encode( $o['measurements'] ) : '',
		'Moodboard'      => $o['moodboardUrl'],
		'Message client' => $o['message'],
		'Note atelier'   => $o['note'],
	);
	$lines = array();
	foreach ( $details as $label => $val ) {
		if ( '' !== (string) $val ) {
			$lines[] = $label . ' : ' . $val;
		}
	}
	$order->calculate_totals( false );
	$order->set_status( addb_status_to_wc( $o['status'] ), 'Importée depuis le site Vercel.' );
	$order->save();
	$order->add_order_note( implode( "\n", $lines ) );

	$map[ $o['id'] ] = $order->get_id();
	update_option( 'addb_order_map', $map, false );
	return true;
}

/** Retourne true si le message a été créé. */
function addb_upsert_contact( $c ) {
	if ( empty( $c['id'] ) ) {
		return false;
	}
	$exists = get_posts( array(
		'post_type'   => ADDB_CPT,
		'post_status' => 'any',
		'meta_key'    => ADDB_META,
		'meta_value'  => $c['id'],
		'fields'      => 'ids',
		'numberposts' => 1,
	) );
	if ( $exists ) {
		return false;
	}
	$id = wp_insert_post( array(
		'post_type'    => ADDB_CPT,
		'post_status'  => 'publish',
		'post_title'   => wp_strip_all_tags( $c['name'] . ( $c['type'] ? ' — ' . $c['type'] : '' ) ),
		'post_content' => sanitize_textarea_field( $c['message'] ),
		'post_date'    => get_date_from_gmt( gmdate( 'Y-m-d H:i:s', strtotime( $c['createdAt'] ) ) ),
	) );
	if ( ! $id || is_wp_error( $id ) ) {
		return false;
	}
	update_post_meta( $id, ADDB_META, $c['id'] );
	update_post_meta( $id, '_addb_email', sanitize_email( $c['email'] ) );
	update_post_meta( $id, '_addb_phone', sanitize_text_field( (string) $c['phone'] ) );
	update_post_meta( $id, '_addb_status', sanitize_key( $c['status'] ) );
	update_post_meta( $id, '_addb_note', sanitize_textarea_field( (string) $c['note'] ) );
	return true;
}

/* Cron toutes les 15 min. */
add_filter( 'cron_schedules', function ( $s ) {
	$s['addb_15min'] = array( 'interval' => 15 * MINUTE_IN_SECONDS, 'display' => 'Toutes les 15 minutes' );
	return $s;
} );
add_action( ADDB_CRON, 'addb_sync' );
register_activation_hook( __FILE__, function () {
	if ( ! wp_next_scheduled( ADDB_CRON ) ) {
		wp_schedule_event( time() + 60, 'addb_15min', ADDB_CRON );
	}
} );
register_deactivation_hook( __FILE__, function () {
	wp_clear_scheduled_hook( ADDB_CRON );
} );

/* ------------------------------------------------------------------ */
/* 4. Statuts WordPress → Vercel                                       */
/* ------------------------------------------------------------------ */

add_action( 'woocommerce_order_status_changed', function ( $order_id, $from, $to, $order ) {
	if ( $GLOBALS['addb_syncing'] ) {
		return;
	}
	$vid    = $order->get_meta( ADDB_META );
	$status = addb_status_from_wc( $to );
	if ( $vid && $status ) {
		$r = addb_api( 'PATCH', array( 'kind' => 'order', 'id' => $vid, 'status' => $status ) );
		$order->add_order_note( is_wp_error( $r ) ? 'Échec de l’envoi du statut à Vercel : ' . $r->get_error_message() : 'Statut envoyé au site Vercel : ' . $status );
	}
}, 10, 4 );

/* ------------------------------------------------------------------ */
/* 5. Messages de contact (type de contenu + statut éditable)          */
/* ------------------------------------------------------------------ */

const ADDB_CONTACT_STATUSES = array(
	'new'         => 'Nouveau',
	'in_progress' => 'En cours',
	'answered'    => 'Répondu',
	'archived'    => 'Archivé',
);

add_action( 'init', function () {
	register_post_type( ADDB_CPT, array(
		'labels'       => array( 'name' => 'Messages de contact', 'singular_name' => 'Message de contact', 'edit_item' => 'Message de contact' ),
		'public'       => false,
		'show_ui'      => true,
		'show_in_menu' => 'addb',
		'supports'     => array( 'title', 'editor' ),
		'capabilities' => array( 'create_posts' => 'do_not_allow' ),
		'map_meta_cap' => true,
	) );
} );

add_action( 'add_meta_boxes_' . ADDB_CPT, function () {
	add_meta_box( 'addb_contact', 'Suivi', function ( $post ) {
		$email  = get_post_meta( $post->ID, '_addb_email', true );
		$phone  = get_post_meta( $post->ID, '_addb_phone', true );
		$status = get_post_meta( $post->ID, '_addb_status', true );
		wp_nonce_field( 'addb_contact', 'addb_contact_nonce' );
		echo '<p><a href="mailto:' . esc_attr( $email ) . '">' . esc_html( $email ) . '</a>' . ( $phone ? '<br>' . esc_html( $phone ) : '' ) . '</p>';
		echo '<p><label>Statut<br><select name="addb_status">';
		foreach ( ADDB_CONTACT_STATUSES as $k => $label ) {
			echo '<option value="' . esc_attr( $k ) . '"' . selected( $status, $k, false ) . '>' . esc_html( $label ) . '</option>';
		}
		echo '</select></label></p><p><label>Note interne<br><textarea name="addb_note" rows="4" style="width:100%">' . esc_textarea( get_post_meta( $post->ID, '_addb_note', true ) ) . '</textarea></label></p>';
	}, null, 'side' );
} );

add_action( 'save_post_' . ADDB_CPT, function ( $post_id ) {
	if ( $GLOBALS['addb_syncing'] || ! isset( $_POST['addb_contact_nonce'] ) || ! wp_verify_nonce( $_POST['addb_contact_nonce'], 'addb_contact' ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	$status = sanitize_key( wp_unslash( $_POST['addb_status'] ?? '' ) );
	if ( ! isset( ADDB_CONTACT_STATUSES[ $status ] ) ) {
		return;
	}
	$note = sanitize_textarea_field( wp_unslash( $_POST['addb_note'] ?? '' ) );
	update_post_meta( $post_id, '_addb_status', $status );
	update_post_meta( $post_id, '_addb_note', $note );
	$vid = get_post_meta( $post_id, ADDB_META, true );
	if ( $vid ) {
		addb_api( 'PATCH', array( 'kind' => 'contact', 'id' => $vid, 'status' => $status, 'note' => $note ) );
	}
} );

add_filter( 'manage_' . ADDB_CPT . '_posts_columns', function ( $cols ) {
	return array( 'cb' => $cols['cb'], 'title' => 'Nom', 'addb_email' => 'Courriel', 'addb_status' => 'Statut', 'date' => 'Date' );
} );
add_action( 'manage_' . ADDB_CPT . '_posts_custom_column', function ( $col, $id ) {
	if ( 'addb_email' === $col ) {
		echo esc_html( get_post_meta( $id, '_addb_email', true ) );
	} elseif ( 'addb_status' === $col ) {
		$s = get_post_meta( $id, '_addb_status', true );
		echo esc_html( isset( ADDB_CONTACT_STATUSES[ $s ] ) ? ADDB_CONTACT_STATUSES[ $s ] : $s );
	}
}, 10, 2 );

/* ------------------------------------------------------------------ */
/* 6. Tableau de bord « Additive »                                     */
/* ------------------------------------------------------------------ */

add_action( 'admin_menu', function () {
	add_menu_page( 'Additive', 'Additive', 'manage_options', 'addb', 'addb_page', 'dashicons-visibility', 3 );
	add_submenu_page( 'addb', 'Tableau de bord', 'Tableau de bord', 'manage_options', 'addb', 'addb_page' );
} );

add_action( 'admin_post_addb_save', function () {
	check_admin_referer( 'addb_save' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Accès refusé' );
	}
	$url = esc_url_raw( wp_unslash( $_POST['url'] ?? '' ) );
	$new = array(
		'url'      => $url ? $url : 'https://additive-blue.vercel.app',
		'secret'   => sanitize_text_field( wp_unslash( $_POST['secret'] ?? '' ) ) ?: addb_opt( 'secret' ),
		'redirect' => empty( $_POST['redirect'] ) ? 0 : 1,
	);
	update_option( ADDB_OPT, $new );
	if ( function_exists( 'litespeed_purge_all' ) ) {
		litespeed_purge_all();
	}
	do_action( 'litespeed_purge_all' );
	wp_safe_redirect( admin_url( 'admin.php?page=addb&saved=1' ) );
	exit;
} );

add_action( 'admin_post_addb_sync', function () {
	check_admin_referer( 'addb_sync' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Accès refusé' );
	}
	addb_sync();
	wp_safe_redirect( admin_url( 'admin.php?page=addb&synced=1' ) );
	exit;
} );

function addb_hpos() {
	return class_exists( 'Automattic\WooCommerce\Utilities\OrderUtil' )
		&& Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled();
}

function addb_page() {
	$last = get_option( 'addb_last_sync' );
	$base = addb_url();
	?>
	<div class="wrap">
		<h1>Additive — site Vercel</h1>
		<?php if ( isset( $_GET['saved'] ) ) : ?><div class="notice notice-success"><p>Réglages enregistrés, cache purgé.</p></div><?php endif; ?>
		<?php if ( isset( $_GET['synced'] ) ) : ?><div class="notice notice-<?php echo empty( $last['error'] ) ? 'success' : 'error'; ?>"><p><?php echo esc_html( empty( $last['error'] ) ? 'Synchronisation terminée.' : 'Erreur : ' . $last['error'] ); ?></p></div><?php endif; ?>

		<h2>Gérer le site</h2>
		<p>
			<a class="button button-primary" target="_blank" rel="noopener" href="<?php echo esc_url( $base ); ?>">Voir le site</a>
			<a class="button" target="_blank" rel="noopener" href="<?php echo esc_url( $base . '/admin/dashboard' ); ?>">Back-office Vercel</a>
			<a class="button" target="_blank" rel="noopener" href="<?php echo esc_url( $base . '/admin/products' ); ?>">Produits</a>
			<a class="button" target="_blank" rel="noopener" href="<?php echo esc_url( $base . '/admin/collections' ); ?>">Collections</a>
			<a class="button" target="_blank" rel="noopener" href="<?php echo esc_url( $base . '/admin/content' ); ?>">Contenus</a>
			<a class="button" target="_blank" rel="noopener" href="<?php echo esc_url( $base . '/admin/appearance' ); ?>">Couleurs & médias</a>
			<a class="button" target="_blank" rel="noopener" href="<?php echo esc_url( $base . '/admin/configurator' ); ?>">Configurateur IA</a>
		</p>

		<h2>Synchronisation</h2>
		<?php if ( $last ) : ?>
			<p>Dernière synchro : <strong><?php echo esc_html( wp_date( 'j F Y H:i', $last['time'] ) ); ?></strong>
			<?php if ( ! empty( $last['error'] ) ) : ?> — <span style="color:#b32d2e"><?php echo esc_html( $last['error'] ); ?></span>
			<?php else : ?> — <?php echo (int) $last['new_orders']; ?> nouvelle(s) commande(s), <?php echo (int) $last['new_contacts']; ?> nouveau(x) message(s).
				Site : <?php echo (int) ( $last['stats']['products'] ?? 0 ); ?> produits, <?php echo (int) ( $last['stats']['collections'] ?? 0 ); ?> collections.
			<?php endif; ?></p>
		<?php else : ?><p>Jamais synchronisé.</p><?php endif; ?>
		<p>Automatique toutes les 15 minutes.
			<a href="<?php echo esc_url( admin_url( addb_hpos() ? 'admin.php?page=wc-orders' : 'edit.php?post_type=shop_order' ) ); ?>">Commandes WooCommerce</a> ·
			<a href="<?php echo esc_url( admin_url( 'edit.php?post_type=' . ADDB_CPT ) ); ?>">Messages de contact</a></p>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<?php wp_nonce_field( 'addb_sync' ); ?><input type="hidden" name="action" value="addb_sync">
			<?php submit_button( 'Synchroniser maintenant', 'secondary', 'submit', false ); ?>
		</form>

		<h2>Réglages</h2>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<?php wp_nonce_field( 'addb_save' ); ?><input type="hidden" name="action" value="addb_save">
			<table class="form-table">
				<tr><th>Adresse du site Vercel</th><td><input type="url" class="regular-text" name="url" value="<?php echo esc_attr( addb_opt( 'url' ) ); ?>"></td></tr>
				<tr><th>Clé de synchronisation</th><td><input type="password" class="regular-text" name="secret" autocomplete="new-password" placeholder="<?php echo addb_opt( 'secret' ) ? '•••••••• (enregistrée — laisser vide pour conserver)' : 'Coller WP_SYNC_SECRET'; ?>"><p class="description">Même valeur que la variable <code>WP_SYNC_SECRET</code> du projet Vercel.</p></td></tr>
				<tr><th>Redirection 301</th><td><label><input type="checkbox" name="redirect" value="1" <?php checked( addb_opt( 'redirect' ) ); ?>> Rediriger les visiteurs du sous-site vers le site Vercel</label><p class="description">Les administrateurs connectés voient toujours le WordPress.</p></td></tr>
			</table>
			<?php submit_button( 'Enregistrer' ); ?>
		</form>
	</div>
	<?php
}
