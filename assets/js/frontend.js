(function ($) {
    'use strict';

    if (typeof SOCPSettings === 'undefined') {
        return;
    }

    function markComponentProcessed($component) {
        $component.attr('data-socp-processed', 'true');
    }

    function isComponentProcessed($component) {
        return $component.attr('data-socp-processed') === 'true';
    }

    function componentHasSelection($component) {
        if ($component.find('.wooco_component_product_selected, .wooco_component_product_selected_list_item').length) {
            return true;
        }

        if ($component.find('input[type="radio"]:checked, input[type="checkbox"]:checked').length) {
            return true;
        }

        var hasSelect = $component.find('select').filter(function () {
            var value = $(this).val();
            return value !== null && value !== undefined && value !== '';
        }).length > 0;

        if (hasSelect) {
            return true;
        }

        var hasHiddenSelection = $component.find('input[type="hidden"][name*="selected"][value]')
            .filter(function () {
                var value = $(this).val();
                return value !== null && value !== undefined && value !== '' && value !== '0';
            }).length > 0;

        return hasHiddenSelection;
    }

    function triggerChoosePanel($component) {
        var $choose = $component.find('.wooco_component_product_selection_list_item_choose:visible').first();

        if ($choose.length) {
            $choose.trigger('click');
        }
    }

    function selectFromList($component) {
        var $list = $component.find('.wooco_component_product_selection_list, .wooco_component_product_list');
        var $firstItem = $list.find('.wooco_component_product_selection_list_item, .wooco_component_product_list_item')
            .filter(function () {
                var $item = $(this);
                return !$item.hasClass('disabled') && !$item.hasClass('wooco-disable') && !$item.hasClass('out-of-stock');
            })
            .first();

        if (!$firstItem.length) {
            return false;
        }

        var $action = $firstItem.find('.wooco_component_product_selection_list_item_add, .wooco_component_product_selection_list_item_select, button, a').filter(function () {
            var $el = $(this);
            return $el.is(':visible');
        }).first();

        if ($action.length) {
            $action.trigger('click');
            return true;
        }

        var $input = $firstItem.find('input[type="radio"], input[type="checkbox"]').filter(function () {
            return !$(this).prop('disabled');
        }).first();

        if ($input.length) {
            $input.prop('checked', true).trigger('change');
            return true;
        }

        $firstItem.trigger('click');
        return true;
    }

    function selectFromDropdown($component) {
        var $selects = $component.find('select').filter(function () {
            return !$(this).prop('disabled');
        });

        var selected = false;

        $selects.each(function () {
            var $select = $(this);
            if ($select.val()) {
                selected = true;
                return;
            }

            var $option = $select.find('option').filter(function () {
                var $opt = $(this);
                return !$opt.prop('disabled') && $opt.val();
            }).first();

            if ($option.length) {
                $select.val($option.val()).trigger('change');
                selected = true;
            }
        });

        return selected;
    }

    function autoSelectComponent($component) {
        if (componentHasSelection($component)) {
            markComponentProcessed($component);
            return;
        }

        triggerChoosePanel($component);

        var selected = selectFromDropdown($component);

        if (!selected) {
            selected = selectFromList($component);
        }

        if (!selected) {
            var $inputs = $component.find('input[type="radio"], input[type="checkbox"]').filter(function () {
                var $input = $(this);
                return !$input.prop('disabled');
            });

            if ($inputs.length) {
                $inputs.each(function () {
                    var $input = $(this);
                    if (!$input.prop('checked')) {
                        $input.prop('checked', true).trigger('change');
                    }
                });

                selected = true;
            }
        }

        if (selected) {
            markComponentProcessed($component);
        } else {
            // Retry once the DOM settles as items might still be loading
            setTimeout(function () {
                autoSelectComponent($component);
            }, 150);
        }
    }

    function autoSelectAll($context) {
        if (!SOCPSettings.autoSelect) {
            return;
        }

        $context.find('.wooco_component').each(function () {
            var $component = $(this);

            if (isComponentProcessed($component)) {
                return;
            }

            autoSelectComponent($component);
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
