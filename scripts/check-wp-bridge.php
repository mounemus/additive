<?php
// Self-check des correspondances du plugin WordPress (php scripts/check-wp-bridge.php).
define( 'ABSPATH', 1 ); define( 'MINUTE_IN_SECONDS', 60 );
foreach ( array( 'add_action', 'add_filter', 'register_activation_hook', 'register_deactivation_hook' ) as $f ) { eval( "function $f(){}" ); }
require __DIR__ . '/../wordpress/additive-bridge/additive-bridge.php';
$cases = array( '/produit/helix/' => '/produits/helix', '/produit/lunettes-personnalisees-additive/' => '/personnalisation',
	'/categorie-produit/eclipso/' => '/collections/modulair', '/product-category/generative' => '/collections/generative',
	'/shop/' => '/produits', '/my-account/' => '/account', '/' => null, '/produits/helix' => null, '/admin/products' => null );
foreach ( $cases as $in => $out ) { assert( addb_legacy_map( $in ) === $out, "$in" ); }
foreach ( array( '/wp-admin/', '/wp-login.php', '/wp-json/additive/v1/x', '/wp-content/uploads/a.glb' ) as $wp ) { assert( addb_is_wp_path( $wp ), $wp ); }
foreach ( array( '/', '/produits/helix', '/_next/static/x.js', '/api/contact', '/admin', '/wp-adminx' ) as $next ) { assert( ! addb_is_wp_path( $next ), $next ); }
foreach ( array( 'pending', 'on-hold', 'processing', 'completed', 'cancelled' ) as $wc ) {
	assert( addb_status_to_wc( addb_status_from_wc( $wc ) ) === $wc, "aller-retour $wc" );
}
echo "ok\n";
