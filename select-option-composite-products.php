<?php
/**
 * Plugin Name: Select Option Composite Products
 * Description: Extends WPC Composite Products for WooCommerce with additional front-end options.
 * Version: 1.0.0
 * Author: ChatGPT
 * Text Domain: select-option-composite-products
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class SOCP_Plugin {

    const OPTION_AUTO_SELECT = 'socp_auto_select_all_components';
    const OPTION_HIDE_CHOOSE = 'socp_hide_choose_button';

    /**
     * Bootstraps the plugin.
     */
    public static function init() {
        $instance = new self();
        $instance->hooks();
    }

    /**
     * Register WordPress hooks.
     */
    private function hooks() {
        add_action( 'admin_init', [ $this, 'register_settings' ] );
        add_action( 'admin_menu', [ $this, 'register_menu' ] );
        add_action( 'admin_notices', [ $this, 'maybe_show_dependency_notice' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend_assets' ] );
        add_action( 'plugins_loaded', [ $this, 'load_textdomain' ] );
    }

    /**
     * Load plugin textdomain.
     */
    public function load_textdomain() {
        load_plugin_textdomain( 'select-option-composite-products', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
    }

    /**
     * Register plugin settings.
     */
    public function register_settings() {
        register_setting( 'socp_settings_group', self::OPTION_AUTO_SELECT, [
            'type'              => 'boolean',
            'sanitize_callback' => [ $this, 'sanitize_boolean_option' ],
            'default'           => false,
        ] );

        register_setting( 'socp_settings_group', self::OPTION_HIDE_CHOOSE, [
            'type'              => 'boolean',
            'sanitize_callback' => [ $this, 'sanitize_boolean_option' ],
            'default'           => false,
        ] );

        add_settings_section(
            'socp_settings_section',
            __( 'Composite Products Enhancements', 'select-option-composite-products' ),
            [ $this, 'render_settings_section_intro' ],
            'socp_settings_page'
        );

        add_settings_field(
            self::OPTION_AUTO_SELECT,
            __( 'Auto-select all component products', 'select-option-composite-products' ),
            [ $this, 'render_checkbox_field' ],
            'socp_settings_page',
            'socp_settings_section',
            [ 'option_key' => self::OPTION_AUTO_SELECT ]
        );

        add_settings_field(
            self::OPTION_HIDE_CHOOSE,
            __( 'Hide "Choose" links', 'select-option-composite-products' ),
            [ $this, 'render_checkbox_field' ],
            'socp_settings_page',
            'socp_settings_section',
            [ 'option_key' => self::OPTION_HIDE_CHOOSE ]
        );
    }

    /**
     * Render the introduction for the settings section.
     */
    public function render_settings_section_intro() {
        echo '<p>' . esc_html__( 'Configure how component products are displayed and pre-selected for WPC Composite Products.', 'select-option-composite-products' ) . '</p>';
    }

    /**
     * Sanitize a boolean option.
     *
     * @param mixed $value Raw option value.
     * @return bool
     */
    public function sanitize_boolean_option( $value ) {
        return ! empty( $value );
    }

    /**
     * Render a checkbox field for the settings form.
     *
     * @param array $args Field arguments.
     */
    public function render_checkbox_field( $args ) {
        $option_key = isset( $args['option_key'] ) ? $args['option_key'] : '';
        $value      = (bool) get_option( $option_key, false );
        ?>
        <label>
            <input type="checkbox" name="<?php echo esc_attr( $option_key ); ?>" value="1" <?php checked( $value ); ?> />
            <?php
            if ( self::OPTION_AUTO_SELECT === $option_key ) {
                esc_html_e( 'Automatically select all products in each component when the composite product loads.', 'select-option-composite-products' );
            } elseif ( self::OPTION_HIDE_CHOOSE === $option_key ) {
                esc_html_e( 'Hide the "Choose" action link displayed for component items.', 'select-option-composite-products' );
            }
            ?>
        </label>
        <?php
    }

    /**
     * Register the plugin settings page under the WooCommerce menu.
     */
    public function register_menu() {
        add_submenu_page(
            'woocommerce',
            __( 'Composite Products Options', 'select-option-composite-products' ),
            __( 'Composite Products Options', 'select-option-composite-products' ),
            'manage_woocommerce',
            'socp-settings',
            [ $this, 'render_settings_page' ]
        );
    }

    /**
     * Render the settings page.
     */
    public function render_settings_page() {
        if ( ! current_user_can( 'manage_woocommerce' ) ) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Composite Products Options', 'select-option-composite-products' ); ?></h1>
            <form method="post" action="options.php">
                <?php
                settings_fields( 'socp_settings_group' );
                do_settings_sections( 'socp_settings_page' );
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    /**
     * Show notice if WPC Composite Products plugin is not active.
     */
    public function maybe_show_dependency_notice() {
        if ( class_exists( 'WPCleverWooco' ) ) {
            return;
        }

        echo '<div class="notice notice-warning"><p>' . esc_html__( 'Select Option Composite Products requires the "WPC Composite Products for WooCommerce" plugin to be active.', 'select-option-composite-products' ) . '</p></div>';
    }

    /**
     * Enqueue frontend assets when needed.
     */
    public function enqueue_frontend_assets() {
        if ( ! class_exists( 'WPCleverWooco' ) ) {
            return;
        }

        $auto_select = (bool) get_option( self::OPTION_AUTO_SELECT, false );
        $hide_choose = (bool) get_option( self::OPTION_HIDE_CHOOSE, false );

        if ( ! $auto_select && ! $hide_choose ) {
            return;
        }

        wp_enqueue_script(
            'socp-frontend',
            plugin_dir_url( __FILE__ ) . 'assets/js/frontend.js',
            [ 'jquery' ],
            '1.0.0',
            true
        );

        wp_localize_script(
            'socp-frontend',
            'SOCPSettings',
            [
                'autoSelect' => $auto_select,
                'hideChoose' => $hide_choose,
            ]
        );

        if ( $hide_choose ) {
            wp_enqueue_style(
                'socp-frontend',
                plugin_dir_url( __FILE__ ) . 'assets/css/frontend.css',
                [],
                '1.0.0'
            );
        }
    }
}

SOCP_Plugin::init();
