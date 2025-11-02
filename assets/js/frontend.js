(function ($) {
    'use strict';

    if (typeof SOCPSettings === 'undefined') {
        return;
    }

    function autoSelectAll($context) {
        if (!SOCPSettings.autoSelect) {
            return;
        }

        $context.find('.wooco_component').each(function () {
            var $component = $(this);

            if ($component.data('socp-auto-selected')) {
                return;
            }

            $component.data('socp-auto-selected', true);

            $component.find('.wooco_component_product_selection_list_item_choose').each(function () {
                var $trigger = $(this);

                if ($trigger.is(':visible')) {
                    $trigger.trigger('click');
                }
            });

            $component.find('input[type="checkbox"]').each(function () {
                var $checkbox = $(this);

                if (!$checkbox.prop('checked') && !$checkbox.prop('disabled')) {
                    $checkbox.prop('checked', true).trigger('change');
                }
            });

            var $radios = $component.find('input[type="radio"]');
            if ($radios.length) {
                var $radioToSelect = $radios.filter(':checked').first();

                if (!$radioToSelect.length) {
                    $radioToSelect = $radios.filter(function () {
                        return !$(this).prop('disabled');
                    }).first();
                }

                if ($radioToSelect.length && !$radioToSelect.prop('checked')) {
                    $radioToSelect.prop('checked', true).trigger('change');
                }
            }
        });
    }

    function hideChooseLinks($context) {
        if (!SOCPSettings.hideChoose) {
            return;
        }

        $context.find('.wooco_component_product_selection_list_item_choose').addClass('socp-hidden-choose').attr('aria-hidden', 'true');
    }

    function applyEnhancements($context) {
        $context = $context || $(document);

        autoSelectAll($context);
        hideChooseLinks($context);
    }

    function observeDomChanges() {
        if (typeof MutationObserver === 'undefined') {
            return;
        }

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                $(mutation.addedNodes).each(function () {
                    var $node = $(this);

                    if (!$node.find) {
                        return;
                    }

                    if ($node.hasClass('wooco_component')) {
                        applyEnhancements($node);
                    } else {
                        var $component = $node.find('.wooco_component');
                        if ($component.length) {
                            applyEnhancements($component);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    $(function () {
        applyEnhancements($(document));

        observeDomChanges();

        $(document).on('wooco_loaded wooco_component_loaded', function () {
            applyEnhancements($(document));
        });
    });
})(jQuery);
