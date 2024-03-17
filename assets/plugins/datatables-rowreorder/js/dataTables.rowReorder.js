/*! RowReorder 1.2.7
 * 2015-2020 SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     RowReorder
 * @description Row reordering extension for DataTables
 * @version     1.2.7
 * @file        dataTables.rowReorder.js
 * @author      SpryMedia Ltd (www.sprymedia.co.uk)
 * @contact     www.sprymedia.co.uk/contact
 * @copyright   Copyright 2015-2020 SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


/**
 * RowReorder provides the ability in DataTables to click and drag rows to
 * reorder them. When a row is dropped the data for the rows effected will be
 * updated to reflect the change. Normally this data point should also be the
 * column being sorted upon in the DataTable but this does not need to be the
 * case. RowReorder implements a "data swap" method - so the rows being
 * reordered take the value of the data point from the row that used to occupy
 * the row's new position.
 *
 * Initialisation is done by either:
 *
 * * `rowReorder` parameter in the DataTable initialisation object
 * * `new $.fn.dataTable.RowReorder( table, opts )` after DataTables
 *   initialisation.
 * 
 *  @class
 *  @param {object} settings DataTables settings object for the host table
 *  @param {object} [opts] Configuration options
 *  @requires jQuery 1.7+
 *  @requires DataTables 1.10.7+
 */
var RowReorder = function ( dt, opts ) {
	if ( ! DataTable.versionCheck || ! DataTable.versionCheck( '1.10.8' ) ) {
		throw 'DataTables RowReorder requires DataTables 1.10.8 or newer';
	}
	this.c = $.extend( true, {},
		DataTable.defaults.rowReorder,
		RowReorder.defaults,
		opts
	);
	this.s = {
		/** @type {integer} Scroll body top cache */
		bodyTop: null,

		/** @type {DataTable.Api} DataTables' API instance */
		dt: new DataTable.Api( dt ),

		/** @type {function} Data fetch function */
		getDataFn: DataTable.ext.oApi._fnGetObjectDataFn( this.c.dataSrc ),

		/** @type {array} Pixel positions for row insertion calculation */
		middles: null,

		/** @type {Object} Cached dimension information for use in the mouse move event handler */
		scroll: {},

		/** @type {integer} Interval object used for smooth scrolling */
		scrollInterval: null,

		/** @type {function} Data set function */
		setDataFn: DataTable.ext.oApi._fnSetObjectDataFn( this.c.dataSrc ),

		/** @type {Object} Mouse down information */
		start: {
			top: 0,
			left: 0,
			offsetTop: 0,
			offsetLeft: 0,
			nodes: []
		},

		/** @type {integer} Window height cached value */
		windowHeight: 0,

		/** @type {integer} Document outer height cached value */
		documentOuterHeight: 0,

		/** @type {integer} DOM clone outer height cached value */
		domCloneOuterHeight: 0
	};
	this.dom = {
		/** @type {jQuery} Cloned row being moved around */
		clone: null,

		/** @type {jQuery} DataTables scrolling container */
		dtScroll: $('div.dataTables_scrollBody', this.s.dt.table().container())
	};
	var settings = this.s.dt.settings()[0];
	var exisiting = settings.rowreorder;

	if ( exisiting ) {
		return exisiting;
	}

	if ( !this.dom.dtScroll.length ) {
		this.dom.dtScroll = $(this.s.dt.table().container(), 'tbody')
	}

	settings.rowreorder = this;
	this._constructor();
};


$.extend( RowReorder.prototype, {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */

	/**
	 * Initialise the RowReorder instance
	 *
	 * @private
	 */
	_constructor: function ()
	{
		var that = this;
		var dt = this.s.dt;
		var table = $( dt.table().node() );
		if ( table.css('position') === 'static' ) {
			table.css( 'position', 'relative' );
		}
		$(dt.table().container()).on( 'mousedown.rowReorder touchstart.rowReorder', this.c.selector, function (e) {
			if ( ! that.c.enable ) {
				return;
			}
			if ( $(e.target).is(that.c.excludedChildren) ) {
				return true;
			}

			var tr = $(this).closest('tr');
			var row = dt.row( tr );
			if ( row.any() ) {
				that._emitEvent( 'pre-row-reorder', {
					node: row.node(),
					index: row.index()
				} );

				that._mouseDown( e, tr );
				return false;
			}
		} );

		dt.on( 'destroy.rowReorder', function () {
			$(dt.table().container()).off( '.rowReorder' );
			dt.off( '.rowReorder' );
		} );
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods
	 */
	
	/**
	 * Cache the measurements that RowReorder needs in the mouse move handler
	 * to attempt to speed things up, rather than reading from the DOM.
	 *
	 * @private
	 */
	_cachePositions: function ()
	{
		var dt = this.s.dt;
		var headerHeight = $( dt.table().node() ).find('thead').outerHeight();
		var nodes = $.unique( dt.rows( { page: 'current' } ).nodes().toArray() );
		var middles = $.map( nodes, function ( node, i ) {
			var top = $(node).position().top - headerHeight;

			return (top + top + $(node).outerHeight() ) / 2;
		} );

		this.s.middles = middles;
		this.s.bodyTop = $( dt.table().body() ).offset().top;
		this.s.windowHeight = $(window).height();
		this.s.documentOuterHeight = $(document).outerHeight();
	},


	/**
	 * Clone a row so it can be floated around the screen
	 *
	 * @param  {jQuery} target Node to be cloned
	 * @private
	 */
	_clone: function ( target )
	{
		var dt = this.s.dt;
		var clone = $( dt.table().node().cloneNode(false) )
			.addClass( 'dt-rowReorder-float' )
			.append('<tbody/>')
			.append( target.clone( false ) );
		var tableWidth = target.outerWidth();
		var tableHeight = target.outerHeight();
		var sizes = target.children().map( function () {
			return $(this).width();
		} );

		clone
			.width( tableWidth )
			.height( tableHeight )
			.find('tr').children().each( function (i) {
				this.style.width = sizes[i]+'px';
			} );
		clone.appendTo( 'body' );

		this.dom.clone = clone;
		this.s.domCloneOuterHeight = clone.outerHeight();
	},


	/**
	 * Update the cloned item's position in the document
	 *
	 * @param  {object} e Event giving the mouse's position
	 * @private
	 */
	_clonePosition: function ( e )
	{
		var start = this.s.start;
		var topDiff = this._eventToPage( e, 'Y' ) - start.top;
		var leftDiff = this._eventToPage( e, 'X' ) - start.left;
		var snap = this.c.snapX;
		var left;
		var top = topDiff + start.offsetTop;

		if ( snap === true ) {
			left = start.offsetLeft;
		}
		else if ( typeof snap === 'number' ) {
			left = start.offsetLeft + snap;
		}
		else {
			left = leftDiff + start.offsetLeft;
		}

		if(top < 0) {
			top = 0
		}
		else if(top + this.s.domCloneOuterHeight > this.s.documentOuterHeight) {
			top = this.s.documentOuterHeight - this.s.domCloneOuterHeight;
		}

		this.dom.clone.css( {
			top: top,
			left: left
		} );
	},


	/**
	 * Emit an event on the DataTable for listeners
	 *
	 * @param  {string} name Event name
	 * @param  {array} args Event arguments
	 * @private
	 */
	_emitEvent: function ( name, args )
	{
		this.s.dt.iterator( 'table', function ( ctx, i ) {
			$(ctx.nTable).triggerHandler( name+'.dt', args );
		} );
	},


	/**
	 * Get pageX/Y position from an event, regardless of if it is a mouse or
	 * touch event.
	 *
	 * @param  {object} e Event
	 * @param  {string} pos X or Y (must be a capital)
	 * @private
	 */
	_eventToPage: function ( e, pos )
	{
		if ( e.type.indexOf( 'touch' ) !== -1 ) {
			return e.originalEvent.touches[0][ 'page'+pos ];
		}

		return e[ 'page'+pos ];
	},


	/**
	 * Mouse down event handler. Read initial positions and add event handlers
	 * for the move.
	 *
	 * @param  {object} e      Mouse event
	 * @param  {jQuery} target TR element that is to be moved
	 * @private
	 */
	_mouseDown: function ( e, target )
	{
		var that = this;
		var dt = this.s.dt;
		var start = this.s.start;

		var offset = target.offset();
		start.top = this._eventToPage( e, 'Y' );
		start.left = this._eventToPage( e, 'X' );
		start.offsetTop = offset.top;
		start.offsetLeft = offset.left;
		start.nodes = $.unique( dt.rows( { page: 'current' } ).nodes().toArray() );

		this._cachePositions();
		this._clone( target );
		this._clonePosition( e );

		this.dom.target = target;
		target.addClass( 'dt-rowReorder-moving' );

		$( document )
			.on( 'mouseup.rowReorder touchend.rowReorder', function (e) {
				that._mouseUp(e);
			} )
			.on( 'mousemove.rowReorder touchmove.rowReorder', function (e) {
				that._mouseMove(e);
			} );
		if ( $(window).width() === $(document).width() ) {
			$(document.body).addClass( 'dt-rowReorder-noOverflow' );
		}
		var scrollWrapper = this.dom.dtScroll;
		this.s.scroll = {
			windowHeight: $(window).height(),
			windowWidth:  $(window).width(),
			dtTop:        scrollWrapper.length ? scrollWrapper.offset().top : null,
			dtLeft:       scrollWrapper.length ? scrollWrapper.offset().left : null,
			dtHeight:     scrollWrapper.length ? scrollWrapper.outerHeight() : null,
			dtWidth:      scrollWrapper.length ? scrollWrapper.outerWidth() : null
		};
	},


	/**
	 * Mouse move event handler - move the cloned row and shuffle the table's
	 * rows if required.
	 *
	 * @param  {object} e Mouse event
	 * @private
	 */
	_mouseMove: function ( e )
	{
		this._clonePosition( e );
		var bodyY = this._eventToPage( e, 'Y' ) - this.s.bodyTop;
		var middles = this.s.middles;
		var insertPoint = null;
		var dt = this.s.dt;
		for ( var i=0, ien=middles.length ; i<ien ; i++ ) {
			if ( bodyY < middles[i] ) {
				insertPoint = i;
				break;
			}
		}

		if ( insertPoint === null ) {
			insertPoint = middles.length;
		}
		if ( this.s.lastInsert === null || this.s.lastInsert !== insertPoint ) {
			var nodes = $.unique( dt.rows( { page: 'current' } ).nodes().toArray() );

			if ( insertPoint > this.s.lastInsert ) {
				this.dom.target.insertAfter( nodes[ insertPoint-1 ] );
			}
			else {
				this.dom.target.insertBefore( nodes[ insertPoint ] );
			}

			this._cachePositions();

			this.s.lastInsert = insertPoint;
		}

		this._shiftScroll( e );
	},


	/**
	 * Mouse up event handler - release the event handlers and perform the
	 * table updates
	 *
	 * @param  {object} e Mouse event
	 * @private
	 */
	_mouseUp: function ( e )
	{
		var that = this;
		var dt = this.s.dt;
		var i, ien;
		var dataSrc = this.c.dataSrc;

		this.dom.clone.remove();
		this.dom.clone = null;

		this.dom.target.removeClass( 'dt-rowReorder-moving' );

		$(document).off( '.rowReorder' );
		$(document.body).removeClass( 'dt-rowReorder-noOverflow' );

		clearInterval( this.s.scrollInterval );
		this.s.scrollInterval = null;
		var startNodes = this.s.start.nodes;
		var endNodes = $.unique( dt.rows( { page: 'current' } ).nodes().toArray() );
		var idDiff = {};
		var fullDiff = [];
		var diffNodes = [];
		var getDataFn = this.s.getDataFn;
		var setDataFn = this.s.setDataFn;

		for ( i=0, ien=startNodes.length ; i<ien ; i++ ) {
			if ( startNodes[i] !== endNodes[i] ) {
				var id = dt.row( endNodes[i] ).id();
				var endRowData = dt.row( endNodes[i] ).data();
				var startRowData = dt.row( startNodes[i] ).data();

				if ( id ) {
					idDiff[ id ] = getDataFn( startRowData );
				}

				fullDiff.push( {
					node: endNodes[i],
					oldData: getDataFn( endRowData ),
					newData: getDataFn( startRowData ),
					newPosition: i,
					oldPosition: $.inArray( endNodes[i], startNodes )
				} );

				diffNodes.push( endNodes[i] );
			}
		}
		var eventArgs = [ fullDiff, {
			dataSrc:       dataSrc,
			nodes:         diffNodes,
			values:        idDiff,
			triggerRow:    dt.row( this.dom.target ),
			originalEvent: e
		} ];
		this._emitEvent( 'row-reorder', eventArgs );

		var update = function () {
			if ( that.c.update ) {
				for ( i=0, ien=fullDiff.length ; i<ien ; i++ ) {
					var row = dt.row( fullDiff[i].node );
					var rowData = row.data();

					setDataFn( rowData, fullDiff[i].newData );
					dt.columns().every( function () {
						if ( this.dataSrc() === dataSrc ) {
							dt.cell( fullDiff[i].node, this.index() ).invalidate( 'data' );
						}
					} );
				}
				that._emitEvent( 'row-reordered', eventArgs );

				dt.draw( false );
			}
		};
		if ( this.c.editor ) {
			this.c.enable = false;

			this.c.editor
				.edit(
					diffNodes,
					false,
					$.extend( {submit: 'changed'}, this.c.formOptions )
				)
				.multiSet( dataSrc, idDiff )
				.one( 'preSubmitCancelled.rowReorder', function () {
					that.c.enable = true;
					that.c.editor.off( '.rowReorder' );
					dt.draw( false );
				} )
				.one( 'submitUnsuccessful.rowReorder', function () {
					dt.draw( false );
				} )
				.one( 'submitSuccess.rowReorder', function () {
					update();
				} )
				.one( 'submitComplete', function () {
					that.c.enable = true;
					that.c.editor.off( '.rowReorder' );
				} )
				.submit();
		}
		else {
			update();
		}
	},


	/**
	 * Move the window and DataTables scrolling during a drag to scroll new
	 * content into view.
	 *
	 * This matches the `_shiftScroll` method used in AutoFill, but only
	 * horizontal scrolling is considered here.
	 *
	 * @param  {object} e Mouse move event object
	 * @private
	 */
	_shiftScroll: function ( e )
	{
		var that = this;
		var dt = this.s.dt;
		var scroll = this.s.scroll;
		var runInterval = false;
		var scrollSpeed = 5;
		var buffer = 65;
		var
			windowY = e.pageY - document.body.scrollTop,
			windowVert,
			dtVert;
		if ( windowY < $(window).scrollTop() + buffer ) {
			windowVert = scrollSpeed * -1;
		}
		else if ( windowY > scroll.windowHeight + $(window).scrollTop() - buffer ) {
			windowVert = scrollSpeed;
		}
		if ( scroll.dtTop !== null && e.pageY < scroll.dtTop + buffer ) {
			dtVert = scrollSpeed * -1;
		}
		else if ( scroll.dtTop !== null && e.pageY > scroll.dtTop + scroll.dtHeight - buffer ) {
			dtVert = scrollSpeed;
		}
		if ( windowVert || dtVert ) {
			scroll.windowVert = windowVert;
			scroll.dtVert = dtVert;
			runInterval = true;
		}
		else if ( this.s.scrollInterval ) {
			clearInterval( this.s.scrollInterval );
			this.s.scrollInterval = null;
		}
		if ( ! this.s.scrollInterval && runInterval ) {
			this.s.scrollInterval = setInterval( function () {
				if ( scroll.windowVert ) {
					var top = $(document).scrollTop();
					$(document).scrollTop(top + scroll.windowVert);

					if ( top !== $(document).scrollTop() ) {
						var move = parseFloat(that.dom.clone.css("top"));
						that.dom.clone.css("top", move + scroll.windowVert);					
					}
				}
				if ( scroll.dtVert ) {
					var scroller = that.dom.dtScroll[0];

					if ( scroll.dtVert ) {
						scroller.scrollTop += scroll.dtVert;
					}
				}
			}, 20 );
		}
	}
} );



/**
 * RowReorder default settings for initialisation
 *
 * @namespace
 * @name RowReorder.defaults
 * @static
 */
RowReorder.defaults = {
	/**
	 * Data point in the host row's data source object for where to get and set
	 * the data to reorder. This will normally also be the sorting column.
	 *
	 * @type {Number}
	 */
	dataSrc: 0,

	/**
	 * Editor instance that will be used to perform the update
	 *
	 * @type {DataTable.Editor}
	 */
	editor: null,

	/**
	 * Enable / disable RowReorder's user interaction
	 * @type {Boolean}
	 */
	enable: true,

	/**
	 * Form options to pass to Editor when submitting a change in the row order.
	 * See the Editor `from-options` object for details of the options
	 * available.
	 * @type {Object}
	 */
	formOptions: {},

	/**
	 * Drag handle selector. This defines the element that when dragged will
	 * reorder a row.
	 *
	 * @type {String}
	 */
	selector: 'td:first-child',

	/**
	 * Optionally lock the dragged row's x-position. This can be `true` to
	 * fix the position match the host table's, `false` to allow free movement
	 * of the row, or a number to define an offset from the host table.
	 *
	 * @type {Boolean|number}
	 */
	snapX: false,

	/**
	 * Update the table's data on drop
	 *
	 * @type {Boolean}
	 */
	update: true,

	/**
	 * Selector for children of the drag handle selector that mouseDown events
	 * will be passed through to and drag will not activate
	 *
	 * @type {String}
	 */
	excludedChildren: 'a'
};


/*
 * API
 */
var Api = $.fn.dataTable.Api;
Api.register( 'rowReorder()', function () {
	return this;
} );

Api.register( 'rowReorder.enable()', function ( toggle ) {
	if ( toggle === undefined ) {
		toggle = true;
	}

	return this.iterator( 'table', function ( ctx ) {
		if ( ctx.rowreorder ) {
			ctx.rowreorder.c.enable = toggle;
		}
	} );
} );

Api.register( 'rowReorder.disable()', function () {
	return this.iterator( 'table', function ( ctx ) {
		if ( ctx.rowreorder ) {
			ctx.rowreorder.c.enable = false;
		}
	} );
} );


/**
 * Version information
 *
 * @name RowReorder.version
 * @static
 */
RowReorder.version = '1.2.6';


$.fn.dataTable.RowReorder = RowReorder;
$.fn.DataTable.RowReorder = RowReorder;
$(document).on( 'init.dt.dtr', function (e, settings, json) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	var init = settings.oInit.rowReorder;
	var defaults = DataTable.defaults.rowReorder;

	if ( init || defaults ) {
		var opts = $.extend( {}, init, defaults );

		if ( init !== false ) {
			new RowReorder( settings, opts  );
		}
	}
} );


return RowReorder;
}));
