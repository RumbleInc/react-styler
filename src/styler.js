'use strict';

var _ = require('lodash'),
    React = require('react/lib/ReactWithAddons'),
    jss = require('jss'),
    px = require('jss-px'),
    nested = require('jss-nested'),
    vendorPrefixer = require('jss-vendor-prefixer');

jss.use(px);
jss.use(nested);
jss.use(function (rule) {
        var style = rule.style;
        if (!style) {
            return;
        }
        rule.style = {};
        var regExp = /([A-Z])/g;

        _.each(style, function (value, prop) {
            if (!_.isPlainObject(value)) {
                prop = prop
                    .replace(regExp, '-$1')
                    .toLowerCase();
            }
            rule.style[prop] = value;
        });
    }
);
jss.use(vendorPrefixer);
jss.use(function (rule) {
    var style = rule.style;
    if (!style) {
        return;
    }
    _.each(style, function (value, prop) {
        if (prop === 'display' && value === 'flex') {
            style[prop] = ['-webkit-box', '-moz-box', '-ms-flexbox', '-webkit-flex', 'flex'];
        } else if (prop === 'filter') {
            style['-webkit-filter'] = value;
            style['-moz-filter'] = value;
            style['-o-filter'] = value;
            style['-ms-filter'] = value;
        } else if (prop === 'flex') {
            style['-webkit-box-flex'] = value;
            style['-moz-box-flex'] = value;
            style['-webkit-flex'] = value;
            style['-ms-flex'] = value;
        } else if (prop === 'order') {
            style['-webkit-box-ordinal-group'] = value;
            style['-moz-box-ordinal-group'] = value;
            style['-ms-flex-order'] = value;
            style['-webkit-order'] = value;
        }
    });
});

var toNum = function (value) {
    if (_.endsWith(value, 'px')) {
        return parseFloat(value);
    } else {
        return value;
    }
};

var toPx = function (value, attributeName) {
    var ignore = ['columnCount',
        'fillOpacity',
        'flex',
        'flexGrow',
        'flexShrink',
        'fontWeight',
        'lineClamp',
        'lineHeight',
        'opacity',
        'order',
        'orphans',
        'strokeOpacity',
        'widows',
        'zIndex',
        'zoom'];
    if (_.isNumber(value) && ignore.indexOf(attributeName) === -1) {
        return value + 'px';
    } else {
        return value;
    }
};

var stylist = (function () {

    var styles = {};

    return {
        registerComponentStyles: function (componentName, rules) {
            styles[componentName] = _.merge(styles[componentName] || {}, rules);
        },

        getComponentStyles: function (componentName) {
            return styles[componentName] || {};
        },

        mixinFor: function (componentName) {

            var that = this,
                refs = 0,
                sheet;

            var attach = function () {
                if (!sheet) {
                    var rules = {};
                    rules['.' + componentName] = that.getComponentStyles(componentName);
                    sheet = jss.createStyleSheet(JSON.parse(JSON.stringify(rules)), {
                        named: false
                    });
                }

                sheet.attach();
            };

            var detach = function () {
                sheet.detach();
            };

            var ref = function () {
                if (refs === 0) {
                    attach();
                }

                refs++;
                return sheet;
            };

            var deref = function () {
                refs--;

                if (refs === 0) {
                    detach();
                }
            };

            var Mixin = {

                propTypes: {
                    className: React.PropTypes.string
                },

                componentWillMount: function () {
                    this.sheet = ref();
                },

                componentWillUnmount: function () {
                    deref();
                    this.sheet = null;
                },

                className: function (className) {
                    if (arguments.length > 1) {
                        className = Array.prototype.slice.call(arguments, 0);
                    }
                    if (_.isArray(className)) {
                        return _.map(className, function (className) {
                            return this.className(className);
                        }, this).join(' ');
                    } else {
                        className = className || this.constructor.displayName;
                        var generatedClassName = this.sheet.classes[className];
                        if (generatedClassName) {
                            return generatedClassName;
                        } else {
                            if (className === this.constructor.displayName) {
                                return className + (this.props.className ? ' ' + this.props.className : '');
                            } else {
                                return this.constructor.displayName + '-' + className;
                            }
                        }
                    }
                },

                getStyleProp: function (ruleName) {
                    var rules = that.getComponentStyles(componentName);
                    var result = {};
                    if (ruleName && rules) {
                        result = rules[ruleName];
                        if (!result) {
                            result = rules['&-' + ruleName];
                        }
                        if (!result) {
                            result = _.find(rules, function (styles, rule) {
                                return rule.indexOf(ruleName) !== -1;
                            });
                        }
                    } else {
                        result = rules;
                    }
                    return result || {};
                },

                getStyleComputed: function (ruleName) {
                    var rules = this.getStyleProp(ruleName);
                    var div = document.createElement('div');
                    _.each(rules, function (value, attribute) {
                        div.style[attribute] = toPx(value, attribute);
                    });
                    var result = _.mapValues(div.style, function (value) {
                        return toNum(value);
                    });

                    result.widthIncludesPadding = function () {
                        return result.boxSizing === 'border-box' ||
                            result.WebkitBoxSizing === 'border-box' ||
                            result.MozBoxSizing === 'border-box';
                    };

                    result.getInnerWidth = function (includePadding) {
                        if (_.isNumber(result.width)) {
                            var sum = parseFloat(result.width || 0);
                            if (includePadding || !result.widthIncludesPadding()) {
                                sum += parseFloat(result.paddingLeft || 0) + parseFloat(result.paddingRight || 0);
                            }
                            return sum;
                        }
                    };

                    result.getOuterWidth = function () {
                        return result.getInnerWidth() + parseFloat(result.marginLeft || 0) + parseFloat(result.marginRight || 0);
                    };

                    return result;
                },

                classSet: function (classNames) {
                    return Object.keys(classNames)
                        .filter(function (className) {
                            return classNames[className];
                        })
                        .map(function (className) {

                            // Allow non-jss classes to be set
                            if (this.sheet.classes[className] === undefined) {
                                return className;
                            }

                            return this.sheet.classes[className];
                        }.bind(this)).join(' ');
                }
            };

            // Support React Hot Loader
            if (module.hot) {
                Mixin.componentWillUpdate = function () {
                    if (this.sheet !== sheet) {
                        this.sheet.detach();
                        this.sheet = ref();
                    }
                };
            }

            return Mixin;
        }

    };

})();

module.exports = stylist;
