React Styler
============

Nice and simple CSS for React.

Installation
------------

React Styler is available as an npm package.

    npm install react-styler --save

Usage
-----

```javascript
'use strict';
 
var React = require('react/lib/ReactWithAddons'),
    /**
     * include it 
     */
    styler = require('react-styler');
 
var Fieldset = React.createClass({
 
    displayName: 'Fieldset',
 
    propTypes: {
        caption: React.PropTypes.string,
        style: React.PropTypes.object
    },
 
     /**
      * connect it 
      */
   mixins: [styler.mixinFor('Fieldset')],
 
    /**
     * render
     */
 
    render: function () {
        /**
         * use it (className() - is a function provided by mixin) 
         */
        var cn = this.className;
        /* jshint ignore:start */
        return <fieldset className={cn()} style={this.props.style}>
            {this.props.caption && <legend className={cn('caption')}>{this.props.caption}</legend>}
            {this.props.children}
        </fieldset>;
        /* jshint ignore:end */
    }
 
});
 
module.exports = Fieldset;
 
/**
 * style it  
 */
styler.registerComponentStyles('Fieldset', {
    border: '1px solid #dbdbdb',
    padding: '35px 20px 20px',
 
    '& + &': {
        marginTop: 25
    },
 
    '&-caption': { // or use '& legend'
        color: '#474747',
        padding: '0 8px',
        marginLeft: -8
    }
 
});

/**
 * 
 */
React.render(React.createElement(Fieldset, {
        className: 'main',
        caption: 'My Caption'
    }), document.querySelector('#application'));

```

Previous code is generating next markup 


```HTML
<head>
    <style>
        .Fieldset {
          border: 1px solid #dbdbdb;
          padding: 35px 20px 20px;
        }
        .Fieldset + .Fieldset {
          margin-top: 25px;
        }
        .Fieldset-caption {
          color: #474747;
          padding: 0 8px;
          margin-left: -8px;
        }
    </style>
</head>

...

    <fieldset class="Fieldset Fieldset-main">
        <legend class="Fieldset-caption">My Caption</legend>
    </fieldset>
```
