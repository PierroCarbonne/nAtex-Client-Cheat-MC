/*******************************************************************************************************
Auto-Update Unsupported Syntax in Expressions

HOW TO USE:
Run this script from File > Scripts > Run Scripts...

Use the dropdown menu to select which items in the current project will have their expressions updated.

If you opt to update all expressions in the project, the entire project file will be backed up before any expressions are modified.

For more detailed logging, enable the "Logging" checkbox. This will require "Allow Scripts to Write Files and Access Network" is enabled in the preferences.

DISCLAIMER:
This script might not be able update all expression errors related to syntax compatibility. This script will
attempt to contextually find and replace deprecated syntax and common code patterns which are not supported
by the JavaScript expressions engine. For more details, please refer to the online documentation on syntax differences
between the JavaScript engine and the Legacy ExtendScript engine.

https://helpx.adobe.com/after-effects/using/legacy-and-extend-script-engine.html

*******************************************************************************************************/

( function ( thisObj ) {
	scriptBuildUI( thisObj );

	/* UI Builder Functions */
	function scriptBuildUI( thisObj ) {

		var uiStrings = {
			titleBar: localize("$$$/AE/Script/UpdateLegacyExpressions/UpdateExpressionSyntax=Update Expression Syntax"), // Does this title need localization?
			dropDownHeader: localize("$$$/AE/Script/UpdateLegacyExpressions/UpdateExpressionsIn=Update Expressions in:"),
			dropDownItem0: localize("$$$/AE/Script/UpdateLegacyExpressions/AllCompositions=All Compositions"),
			dropDownItem1: localize("$$$/AE/Script/UpdateLegacyExpressions/SelectedComps=Selected Compositions"),
			dropDownItem2: localize("$$$/AE/Script/UpdateLegacyExpressions/AllLayersInActiveComp=All Layers in Active Composition"),
			dropDownItem3: localize("$$$/AE/Script/UpdateLegacyExpressions/SelLayersInActiveComp=Selected Layers in Active Composition"),
			dropDownItem4: localize("$$$/AE/Script/UpdateLegacyExpressions/SelectedProps=Selected Properties"),
			dropDownToolTip: localize("$$$/AE/Script/UpdateLegacyExpressions/SelectItemsToolTip=Select which items will have their expression syntax updated."), // "Applies expression syntax updates to the selected"
			logCheckBoxText: localize("$$$/AE/Script/UpdateLegacyExpressions/EnabledLogging=Enable Logging"),
			logCheckBoxToolTip: localize("$$$/AE/Script/UpdateLegacyExpressions/CreateLogToolTip=Create log file of which properties had their expression syntax updated."),
			helpToolTip: localize("$$$/AE/Script/UpdateLegacyExpressions/HelpBtnToolTip=Show help dialog"),
			updateBtnText: localize("$$$/AE/Script/UpdateLegacyExpressions/UpdateBtnTxt=Update"),
			updateBtnToolTip: localize("$$$/AE/Script/UpdateLegacyExpressions/UpdateToolTip=Update expression syntax for JavaScript expression engine.")
		}

		var win = ( thisObj instanceof Panel ) ? thisObj : new Window( "palette", uiStrings.titleBar, undefined, {
			resizeable: true
		} );

		win.alignChildren = [ "fill", "fill" ];
		win.spacing = 10;

		var dropDownGroup = win.add( "group" );
		dropDownGroup.alignChildren = [ "fill", "fill" ];
		dropDownGroup.orientation = "column";
		dropDownGroup.spacing = 5;

		var dropDownTitle = dropDownGroup.add( "statictext", undefined, uiStrings.dropDownHeader );
		dropDownTitle.alignment = "left";

		var dropDownItems = [
			uiStrings.dropDownItem0,
			uiStrings.dropDownItem1,
			uiStrings.dropDownItem2,
			uiStrings.dropDownItem3,
			uiStrings.dropDownItem4
		];

		var dropDown = dropDownGroup.add( "dropdownlist", undefined, undefined, {
			items: dropDownItems
		} );
		dropDown.selection = 0;
		dropDown.helpTip = uiStrings.dropDownToolTip;

		var updateButtonGroup = win.add( "group" );
		updateButtonGroup.alignChildren = [ "fill", "fill" ];

		var updateButton = updateButtonGroup.add( "button", undefined, uiStrings.updateBtnText );
		updateButton.helpTip = uiStrings.updateBtnToolTip;

		updateButton.onClick = function () {
			updateExpressions( dropDown.selection.index, logCheckBox.value );
		};

		var loggingHelpGroup = win.add( "group" );

		var logCheckBox = loggingHelpGroup.add( "checkbox", undefined, uiStrings.logCheckBoxText );
		logCheckBox.value = false;
		logCheckBox.alignment = [ "left", "fill" ]
		logCheckBox.helpTip = uiStrings.logCheckBoxToolTip;

		var helpBtn = loggingHelpGroup.add( "button", undefined, "\u003F" );
		helpBtn.alignment = [ "right", "fill" ]
		helpBtn.preferredSize = [ 25, 20 ];
		helpBtn.helpTip = uiStrings.helpToolTip;

		helpBtn.onClick = function () {
			helpDialog( uiStrings.titleBar );
		};

		win.onResizing = win.onResize = function () {
			this.layout.resize();
		};

		if ( win instanceof Window ) {
			win.center();
			win.show();
		} else {
			win.layout.layout( true );
			win.layout.resize();
		}
	}

	function helpDialog( title ) {
		var uiStrings = {
			titleBar: "Help",
			helpText: [
				localize("$$$/AE/Script/UpdateLegacyExpressions/HelpUpdatingLegacyExpressions=Updating Legacy Expressions:"),
				localize("$$$/AE/Script/UpdateLegacyExpressions/HelpUpdatingInstructionsOne=From the dropdown menu, select which compositions, layers, or properties will have their expression syntax updated. You will receive a summary of which syntax was updated after the script has completed."),
				"",
				localize("$$$/AE/Script/UpdateLegacyExpressions/HelpUpdatingInstructionsTwo=All expression updates can be undone with Ctrl + Z (Windows) or Cmd + Z (macOS). If you choose to update \"All Compositions\", your project will be backed up before any expression are modified. The backup will be located next to the original project file"),
				"",
				localize("$$$/AE/Script/UpdateLegacyExpressions/HelpLoggingTitle=Logging:"),
				localize("$$$/AE/Script/UpdateLegacyExpressions/HelpLoggingInstructions=If you wish to receive more detailed information about which properties had their expression syntax updated, enable the \"Logging\" checkbox. A log file will be created in the same location as your project file."),
				"",
				localize("$$$/AE/Script/UpdateLegacyExpressions/HelpRemainingErrTitle=\"Why do I still see errors?\":"),
				localize("$$$/AE/Script/UpdateLegacyExpressions/HelpRemainingErrInstructions=Some types of incompatible syntax cannot be updated automatically. If there are still expression errors which occur only when using the new JavaScript engine after running this script, please refer to the online documentation on syntax differences between the JavaScript engine and the Legacy ExtendScript engine at the URL provided below."),
			],
			onlineHelp: localize("$$$/AE/Script/UpdateLegacyExpressions/HelpLinkHeader=Online Expression Documentation:"),
			helpURL: "https://helpx.adobe.com/after-effects/using/legacy-and-extend-script-engine.html", //Is there a localized URL for this page?
			closeText: localize("$$$/AE/Script/UpdateLegacyExpressions/HelpClose=Close"),
		}

		var helpWin = new Window( "dialog", [ title, uiStrings.titleBar ].join( " " ), undefined, );
		helpWin.preferredSize = [ 500, "" ]
		helpWin.spacing = 5;

		var textGroup = helpWin.add( "group" );
		textGroup.orientation = "column";
		textGroup.spacing = 10;

		var helpText = textGroup.add( "statictext", undefined, uiStrings.helpText.join( "\n" ), {
			multiline: true
		} );
		helpText.alignment = "left";
		helpText.characters = 60;

		var helpURL = textGroup.add( "edittext", undefined, uiStrings.helpURL, {
			readonly: true
		} );
		helpURL.characters = 60;

		var closeBtn = helpWin.add( "button", undefined, uiStrings.closeText );

		closeBtn.onClick = function () {
			helpWin.close();
		}

		helpWin.center();
		helpWin.show();
	}

	/* Main Function */
	function updateExpressions( updateOption, loggingEnabled ) {
		var stringsObj = {
			undoStr: localize("$$$/AE/Script/UpdateLegacyExpressions/UpdateExpUndoStr=Update Expressions for JavaScript Engine"),
			confirmUpdateAllTitle: localize("$$$/AE/Script/UpdateLegacyExpressions/ConfirmAllTitle=Update All Expressions in Project"),
			confirmUpdateAllStr: [
				localize("$$$/AE/Script/UpdateLegacyExpressions/ConfirmAllLineOne=This script will attempt to update all the expressions in this project to be compatible with the JavaScript expression engine."),
				localize("$$$/AE/Script/UpdateLegacyExpressions/ConfirmAllLineTwo=The project will be backed up before any expressions are modified."),
				localize("$$$/AE/Script/UpdateLegacyExpressions/ConfirmAllLineThr=Depending on project size, updating the expressions may take some time. Are you sure you want to continue?")
			],
			noActiveErrStr: localize("$$$/AE/Script/UpdateLegacyExpressions/NoActiveCompErr=There is no active composition. Click on the Timeline or Composition Viewer."),
			noSelLayersErrStr: localize("$$$/AE/Script/UpdateLegacyExpressions/NoSelectedLayersErr=There are no layers selected."),
			noSelPropsErrStr: localize("$$$/AE/Script/UpdateLegacyExpressions/NoSelectedPropsErr=There are no properties selected."),
			noExpWereModStr: [
				localize("$$$/AE/Script/UpdateLegacyExpressions/NoExpWereModLineOne=No expressions were modified."),
				localize("$$$/AE/Script/UpdateLegacyExpressions/NoExpWereModLineTwo=If there are still expression errors which occur only when using the new JavaScript engine, please refer to the online documentation on syntax differences between the JavaScript engine and the Legacy ExtendScript engine.")
			],
			backupStr: localize("$$$/AE/Script/UpdateLegacyExpressions/BackupSuffixStr=backup"),
		}

		if ( loggingEnabled && writingFilesEnabled() === false ) {
			// Do nothing and exit if the preference isn't enabled
			return null;
		}

		// Initialize an array for all properties with expressions possibly containing unsupported syntax
		var propsWithExpressions = [];

		switch ( updateOption ) {
			case 0:
				// Prompt to backup entire project and update all expressions
				var confirmUpdateAll = confirm( stringsObj.confirmUpdateAllStr.join( "\n\n" ),
					false,
					stringsObj.confirmUpdateAllTitle );

				if ( confirmUpdateAll ) {

					app.project.save();
					backUpProject( stringsObj.backupStr );

				} else {
					app.endUndoGroup();
					return null;
				}

				app.beginUndoGroup( stringsObj.undoStr );

				propsWithExpressions = getAllExpressionInComps( app.project );
				break;

			case 1:
				app.beginUndoGroup( stringsObj.undoStr );

				propsWithExpressions = getAllExpressionInComps( app.project.selection );
				break;

			case 2:
				var activeComp = getActiveComp();

				if ( !activeComp ) {
					alert( stringsObj.noActiveErrStr );
					return null;
				}

				app.beginUndoGroup( stringsObj.undoStr );

				forAllLayersOfComp( activeComp, function ( layer ) {
					propsWithExpressions = propsWithExpressions.concat( getPropsWithExpressions( layer ) );
				} );
				break;

			case 3:

				var activeComp = getActiveComp();

				if ( !activeComp ) {
					alert( stringsObj.noActiveErrStr );

					return null;
				}

				if ( activeComp.selectedLayers.length === 0 ) {
					alert( stringsObj.noSelLayersErrStr );

					return null;
				}

				app.beginUndoGroup( stringsObj.undoStr );

				forAllSelectedLayersOfComp( activeComp, function ( layer ) {
					propsWithExpressions = propsWithExpressions.concat( getPropsWithExpressions( layer ) );
				} );
				break;

			case 4:

				var activeComp = getActiveComp();

				if ( !activeComp ) {
					alert( stringsObj.noActiveErrStr );

					return null;
				}

				if ( activeComp.selectedProperties.length === 0 ) {
					alert( stringsObj.noSelPropsErrStr );

					return null;
				}

				app.beginUndoGroup( stringsObj.undoStr );

				for ( var p = 0, pl = activeComp.selectedProperties.length; p < pl; p++ ) {
					var theProp = activeComp.selectedProperties[ p ];

					if ( hasExpressionUnsupported( theProp ) ) {
						propsWithExpressions.push( theProp );
					}
				}

				break;

			default:
				alert( stringsObj.noExpWereModStr );
				return null;
		}

		var modifiedExpressions = {};
		var resultArr;

		// If some properties are found, update expression syntax
		if ( propsWithExpressions.length !== 0 ) {

			modifiedExpressions.updatedToCamel = updateToCamelCase( propsWithExpressions );

			modifiedExpressions.singleLineIfElse = findReplaceExpressionsInArray( propsWithExpressions, "else", "\nelse", "}else" );

			modifiedExpressions.thisParenToThisLayer = findReplaceExpressionsInArray( propsWithExpressions, "this(", "thisLayer(" );

			modifiedExpressions.thisDotToThisLayer = findReplaceExpressionsInArray( propsWithExpressions, "this.", "thisLayer." );

			modifiedExpressions.sourceTextArray = findReplaceExpressionsInArray( propsWithExpressions, "sourceText[", "sourceText.value[" );

			modifiedExpressions.hoistFunctions = moveFunctionDeclarations( propsWithExpressions );

			app.expressionEngine = "javascript-1.0";

			app.endUndoGroup();

			var count = 0;

			for ( var k in modifiedExpressions ) {
				if ( modifiedExpressions.hasOwnProperty( k ) ) {
					count += modifiedExpressions[ k ].count;
				}

				if ( count ) {
					break;
				}
			}

			if ( count !== 0 ) {

				var summaryStrings = {
					title: localize("$$$/AE/Script/UpdateLegacyExpressions/SummaryComplete=Complete!"),
					subheader: localize("$$$/AE/Script/UpdateLegacyExpressions/SummarySubHead=Number of properties updated with:"),
					separator: "\u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010 \u2010",
					deprecated: localize("$$$/AE/Script/UpdateLegacyExpressions/SummaryDeprecated=Deprecated syntax: "),
					ifelse: localize("$$$/AE/Script/UpdateLegacyExpressions/SummaryIfElse=Single-line if...else: "),
					thisL: localize("$$$/AE/Script/UpdateLegacyExpressions/SummaryThis=\"this\" replaced by \"thisLayer\": "),
					sourceT: localize("$$$/AE/Script/UpdateLegacyExpressions/SummarySourceText=Source Text index references: "),
					fnDeclar: localize("$$$/AE/Script/UpdateLegacyExpressions/SummaryFnDeclare=Function declarations moved to the top: "),
					logFileLocation: localize("$$$/AE/Script/UpdateLegacyExpressions/SummaryLogLocation=The logging file can be found in the same directory as your current project file."),
				}

				resultArr = [ summaryStrings.title, summaryStrings.subheader, summaryStrings.separator ];

				( modifiedExpressions.updatedToCamel.count ) ? resultArr.push( summaryStrings.deprecated + modifiedExpressions.updatedToCamel.count + "" ): 0;

				( modifiedExpressions.singleLineIfElse.count ) ? resultArr.push( summaryStrings.ifelse + modifiedExpressions.singleLineIfElse.count + "" ): 0;

				( modifiedExpressions.thisParenToThisLayer.count || modifiedExpressions.thisDotToThisLayer.count ) ? resultArr.push( summaryStrings.thisL + ( modifiedExpressions.thisParenToThisLayer.count + modifiedExpressions.thisDotToThisLayer.count ) + "" ): 0;

				( modifiedExpressions.sourceTextArray.count ) ? resultArr.push( summaryStrings.sourceT + modifiedExpressions.sourceTextArray.count + "" ): 0;

				( modifiedExpressions.hoistFunctions.count ) ? resultArr.push( summaryStrings.fnDeclar + modifiedExpressions.hoistFunctions.count + "" ): 0;

				if ( loggingEnabled ) {
					logUpdatedAndFailed( modifiedExpressions );
					resultArr.splice( 1, 0, summaryStrings.logFileLocation );
				}

			} else {
				resultArr = stringsObj.noExpWereModStr;
			}

			alert( resultArr.join( "\n\n" ) );

			return null;

		} else {

			app.endUndoGroup();

			alert( stringsObj.noExpWereModStr.join( "\n\n" ) )

			return null;
		}
	}

	/* Helper Functions */
	function backUpProject( backupSuffix ) {

		app.beginSuppressDialogs();

		var currentProject = app.project.file;

		var currentProjectPath = currentProject.fsName;

		var backUpProjectFile = new File( currentProjectPath.split( ".aep" ).join( [ "-", backupSuffix, ".aep" ].join("") ) );

		app.project.save( backUpProjectFile );

		app.project.save( currentProject );

		app.endSuppressDialogs( false );
	}

	function getActiveComp() {
		var activeItem = app.project.activeItem;

		if ( !( activeItem && activeItem instanceof CompItem ) ) {
			return null;
		}

		if ( app.project.selection.length !== 1 ) {
			return activeItem;
		}

		var numLayers = activeItem.numLayers;

		app.executeCommand( 2767 ); // 'add null object'

		if ( numLayers !== activeItem.numLayers ) {
			app.executeCommand( 16 ); // undo (removes 'null object')
			return activeItem;
		}
	}

	function getAllExpressionInComps( itemSelection ) {

		allItems = [];
		arr = [];

		if ( !( itemSelection instanceof Array ) ) {
			for ( var h = itemSelection.numItems; h; h-- ) {
				allItems.push( itemSelection.item( h ) );
			}
		} else {
			allItems = itemSelection;
		}

		for ( var i = 0, il = allItems.length; i < il; i++ ) {
			var item = allItems[ i ];

			// If item is a composition
			if ( item instanceof CompItem ) {

				// Loop through all layers and get properties with expressions
				forAllLayersOfComp( item, function ( layer ) {
					arr = arr.concat( getPropsWithExpressions( layer ) );
				} );
			}
		}

		return arr;
	}

	function forAllLayersOfComp( thisComp, doSomething ) {
		for ( var i = 1, il = thisComp.layers.length; i <= il; i++ ) {
			var thisLayer = thisComp.layers[ i ];
			doSomething( thisLayer );
		}
	}

	function forAllSelectedLayersOfComp( thisComp, doSomething ) {
		for ( var i = 0, il = thisComp.selectedLayers.length; i < il; i++ ) {
			var thisLayer = thisComp.selectedLayers[ i ];
			doSomething( thisLayer );
		}
	}

	function getPropsWithExpressions( sourcePropGroup ) {
		var arr = [];

		forAllPropsInGroup( sourcePropGroup, function ( prop ) {
			if ( isPropGroup( prop ) ) {
				arr = arr.concat( getPropsWithExpressions( prop ) );
			} else if ( hasExpressionUnsupported( prop ) ) {
				arr.push( prop );
			}
		} );

		return arr;
	}

	function forAllPropsInGroup( propGroup, doSomething ) {
		for ( var i = 1, il = propGroup.numProperties; i <= il; i++ ) {
			var thisProp = propGroup.property( i );
			doSomething( thisProp );
		}
	}

	function isPropGroup( prop ) {
		if ( prop.propertyType === PropertyType.INDEXED_GROUP ||
			prop.propertyType === PropertyType.NAMED_GROUP ||
			prop.dimensionsSeparated )
			return true;
		return false;
	}

	function hasExpressionUnsupported( prop ) {
		// var grabValue = prop.valueAtTime(0, false);

		if ( prop.propertyType === PropertyType.PROPERTY &&
			prop.expression !== "" &&
			// prop.expressionError !== "" &&
			prop.expression.match( /_|else|this\(|this.|sourceText\[|function/ ) &&
			prop.expressionEnabled ) {
			return true;
		}
		return false;
	}

	function updateToCamelCase( propArray ) {
		// Initialize variables for loop
		var thisProp;
		var propLayer;
		var propComp;
		var thisExpression;
		var replaceExpression;

		var logCountObj = {
			count: 0,
			logUpdatedProps: [],
			failedToUpdate: []
		};

		// Loop through properies with expression and replace text.
		for ( var i = 0, il = propArray.length; i < il; i++ ) {
			thisProp = propArray[ i ];
			propLayer = thisProp.propertyGroup( thisProp.propertyDepth );
			propComp = propLayer.containingComp;

			thisExpression = thisProp.expression;

			if ( !thisExpression.match( "_" ) ) {
				continue
			}

			replaceExpression = swapSnakeWithCamel( thisExpression );

			if ( replaceExpression === thisExpression ) {
				continue
			}

			try {

				logCountObj.logUpdatedProps.push( {
					propName: thisProp.name,
					layerName: propLayer.name,
					compName: propComp.name,
				} );

				thisProp.expression = replaceExpression;

				logCountObj.count += 1;

				// thisProp.selected = true;

			} catch ( e ) {

				logCountObj.failedToUpdate.push( {
					propName: thisProp.name,
					layerName: propLayer.name,
					compName: propComp.name,
				} );
			}
		}

		return logCountObj;
	}

	function swapSnakeWithCamel( str ) {
		var snakeToCamel = {
			this_comp: "thisComp",
			this_layer: "thisLayer",
			this_property: "thisProperty",
			color_depth: "colorDepth",
			has_parent: "hasParent",
			in_point: "inPoint",
			out_point: "outPoint",
			start_time: "startTime",
			has_video: "hasVideo",
			has_audio: "hasAudio",
			audio_active: "audioActive",
			anchor_point: "anchorPoint",
			audio_levels: "audioLevels",
			time_remap: "timeRemap",
			casts_shadows: "castsShadows",
			light_transmission: "lightTransmission",
			accepts_shadows: "acceptsShadows",
			accepts_lights: "acceptsLights",
			posterize_time: "posterizeTime",
			look_at: "lookAt",
			seed_random: "seedRandom",
			gauss_random: "gaussRandom",
			ease_in: "easeIn",
			ease_out: "easeOut",
			rgb_to_hsl: "rgbToHsl",
			hsl_to_rgb: "hslToRgb",
			degrees_to_radians: "degreesToRadians",
			radians_to_degrees: "radiansToDegrees",
			from_comp_to_surface: "fromCompToSurface",
			to_comp_vec: "toCompVec",
			from_comp_vec: "fromCompVec",
			to_world_vec: "toWorldVec",
			from_world_vec: "fromWorldVec",
			to_comp: "toComp",
			from_comp: "fromComp",
			to_world: "toWorld",
			from_world: "fromWorld",
			world_position_to_psd: "worldPositionToPsd",
			world_rotation_to_psd: "worldRotationToPsd",
			world_scale_to_psd: "worldScaleToPsd",
			frame_duration: "frameDuration",
			shutter_angle: "shutterAngle",
			shutter_phase: "shutterPhase",
			num_layers: "numLayers",
			pixel_aspect: "pixelAspect",
			point_of_interest: "pointOfInterest",
			depth_of_field: "depthOfField",
			focus_distance: "focusDistance",
			blur_level: "blurLevel",
			cone_angle: "coneAngle",
			cone_feather: "coneFeather",
			shadow_darkness: "shadowDarkness",
			shadow_diffusion: "shadowDiffusion",
			value_at_time: "valueAtTime",
			velocity_at_time: "velocityAtTime",
			speed_at_time: "speedAtTime",
			temporal_wiggle: "temporalWiggle",
			active_camera: "activeCamera",
			nearest_key: "nearestKey",
			loop_in_duration: "loopInDuration",
			loop_out_duration: "loopOutDuration",
			loop_in: "loopIn",
			loop_out: "loopOut",
			num_keys: "numKeys",
		}

		if ( !Object.keys ) {
			Object.keys = ( function () {
				'use strict';
				var hasOwnProperty = Object.prototype.hasOwnProperty,
					hasDontEnumBug = !( {
						toString: null
					} ).propertyIsEnumerable( 'toString' ),
					dontEnums = [
						'toString',
						'toLocaleString',
						'valueOf',
						'hasOwnProperty',
						'isPrototypeOf',
						'propertyIsEnumerable',
						'constructor'
					],
					dontEnumsLength = dontEnums.length;

				return function ( obj ) {
					if ( typeof obj !== 'function' && ( typeof obj !== 'object' || obj === null ) ) {
						throw new TypeError( 'Object.keys called on non-object' );
					}

					var result = [],
						prop, i;

					for ( prop in obj ) {
						if ( hasOwnProperty.call( obj, prop ) ) {
							result.push( prop );
						}
					}

					if ( hasDontEnumBug ) {
						for ( i = 0; i < dontEnumsLength; i++ ) {
							if ( hasOwnProperty.call( obj, dontEnums[ i ] ) ) {
								result.push( dontEnums[ i ] );
							}
						}
					}
					return result;
				};
			}() );
		}

		function replaceAll( str, mapObj ) {
			var re = new RegExp( Object.keys( mapObj ).join( "|" ), "gi" );

			return str.replace( re, function ( matched ) {
				return mapObj[ matched.toLowerCase() ];
			} );
		}

		return replaceAll( str, snakeToCamel );
	}

	function findReplaceExpressionsInArray( propArray, find, replace, skip ) {
		// Initialize variables for loop
		var thisProp;
		var propLayer;
		var propComp;
		var thisExpression;
		var skipThese;
		var splitAt;
		var findExpression;
		var replaceExpression;

		var logCountObj = {
			count: 0,
			logUpdatedProps: [],
			failedToUpdate: []
		};

		// Loop through properies with expression and replace text.
		for ( var i = 0, il = propArray.length; i < il; i++ ) {
			thisProp = propArray[ i ];
			propLayer = thisProp.propertyGroup( thisProp.propertyDepth );
			propComp = propLayer.containingComp;

			thisExpression = thisProp.expression;

			if ( skip !== undefined ) {
				skipThese = [];

				for ( var j = 3, jl = arguments.length; j < jl; j++ ) {
					skipThese.push( "[^" + arguments[ j ] + "]" );
				}

				splitAt = new RegExp( skipThese.join( "" ) + find, "g" );

				findExpression = thisExpression.split( splitAt );
			} else {
				findExpression = thisExpression.split( find );
			}

			if ( findExpression.length === 1 ) {
				continue;
			}

			replaceExpression = findExpression.join( replace );

			try {

				thisProp.expression = replaceExpression;

				logCountObj.logUpdatedProps.push( {
					replaced: find,
					propName: thisProp.name,
					layerName: propLayer.name,
					compName: propComp.name,
				} );

				logCountObj.count += 1;

				// thisProp.selected = true;

			} catch ( e ) {

				logCountObj.failedToUpdate.push( {
					propName: thisProp.name,
					layerName: propLayer.name,
					compName: propComp.name,
				} )

			}
		}

		return logCountObj;
	}

	function moveFunctionDeclarations( propArray ) {
		// Initialize variables for loop
		var thisProp;
		var propLayer;
		var propComp;
		var thisExpression;
		var getFunctions = /function\s*([A-z0-9]+)?\s*\((?:[^)(]|\((?:[^)(]|\([^)(]*\))*\))*\)\s*\{(?:[^}{]|\{(?:[^}{]|\{[^}{]*\})*\})*\}/g;
		var replaceExpression;
		var expFunctionsRemoved;
		var joiner = "";

		var logCountObj = {
			count: 0,
			logUpdatedProps: [],
			failedToUpdate: []
		};

		function trimWhitespace( str ) {
			return str.replace( /^\s+|\s+$/gm, '' );
		}

		// Loop through properies with expression and replace text.
		for ( var i = 0, il = propArray.length; i < il; i++ ) {
			thisProp = propArray[ i ];
			propLayer = thisProp.propertyGroup( thisProp.propertyDepth );
			propComp = propLayer.containingComp;

			thisExpression = thisProp.expression;

			replaceExpression = thisExpression.match( getFunctions );

			if ( replaceExpression ) {
				expFunctionsRemoved = thisExpression;

				for ( var k = 0, kl = replaceExpression.length; k < kl; k++ ) {
					expFunctionsRemoved = expFunctionsRemoved.replace( replaceExpression[ k ], "" )
				}

				replaceExpression.push( "\n\n" );

				replaceExpression.push( expFunctionsRemoved );

				joiner = "\n"
			} else {
				replaceExpression = thisExpression.split( /\nfunction\s|\rfunction\s|\sfunction\s/g )

				if ( replaceExpression.length === 1 ) {
					continue;
				}

				for ( var k = 0, kl = replaceExpression.length; k < kl; k++ ) {
					if ( k === 0 ) {
						replaceExpression[ k ] = "\n\n".concat( replaceExpression[ k ] );
					} else {
						replaceExpression[ k ] = "\nfunction ".concat( replaceExpression[ k ] )
					}
				}

				replaceExpression.push( replaceExpression.shift() );
			}

			replaceExpression[ 0 ] = trimWhitespace( replaceExpression[ 0 ] );

			try {

				thisProp.expression = replaceExpression.join( joiner );

				logCountObj.logUpdatedProps.push( {
					propName: thisProp.name,
					layerName: propLayer.name,
					compName: propComp.name,
				} );

				logCountObj.count += 1;

				// thisProp.selected = true;

			} catch ( e ) {

				logCountObj.failedToUpdate.push( {
					propName: thisProp.name,
					layerName: propLayer.name,
					compName: propComp.name,
				} );
			}
		}

		return logCountObj;
	}

	function logUpdatedAndFailed( loggedObj ) {

		loggingStrings = {
			updated: localize("$$$/AE/Script/UpdateLegacyExpressions/InLogUpdated=Expressions Updated for JavaScript Compatiblity"),
			failed: localize("$$$/AE/Script/UpdateLegacyExpressions/InLogFailed=Expressions Which Failed To Update"),
			logSuffix: localize("$$$/AE/Script/UpdateLegacyExpressions/LogSuffix=Expression Update Log"),
		}

		function addProps( obj, arr, val ) {

			if ( typeof arr === 'string' )
				arr = arr.split( "." );

			obj[ arr[ 0 ] ] = obj[ arr[ 0 ] ] || {};

			var tmpObj = obj[ arr[ 0 ] ];

			if ( arr.length > 1 ) {
				arr.shift();
				addProps( tmpObj, arr, val );
			} else
				obj[ arr[ 0 ] ] = val;

			return obj;
		}

		var updatedPropsObj = {};
		var failedPropsObj = {};

		var splitChar = ( system.osName === "MacOS" ) ? "/" : "\\";

		var arrToLog = [
			app.project.file.fsName.split( splitChar ).pop(),
			new Date().toLocaleString(),
			"",
			loggingStrings.updated,
			"",
		];

		updatedPropsArr = [];
		failedPropsArr = [];

		for ( var k in loggedObj ) {
			if ( loggedObj.hasOwnProperty( k ) ) {
				updatedPropsArr.push( {
					updated: k,
					strings: loggedObj[ k ].logUpdatedProps
				} );

				failedPropsArr.push( {
					updated: k,
					strings: loggedObj[ k ].failedToUpdate
				} );
			}
		}

		for ( var i = 0, il = updatedPropsArr.length; i < il; i++ ) {
			for ( var j = 0, jl = updatedPropsArr[ i ].strings.length; j < jl; j++ ) {
				var updatedInComp = updatedPropsArr[ i ].strings[ j ].compName;
				var updatedOnLayer = updatedPropsArr[ i ].strings[ j ].layerName;
				var updatedSyntax = updatedPropsArr[ i ].updated;
				var updatedProp = updatedPropsArr[ i ].strings[ j ].propName;

				addProps( updatedPropsObj, [ updatedInComp, updatedOnLayer, updatedSyntax ], updatedProp );
			}
		}

		/* Uncomment next line to also output .json log of updated expression properties. */
		// logNextToProject( JSON.stringify( updatedPropsObj, null, "\t" ), "Updated Expressions.json" );

		arrToLog.push( createLogStrings( updatedPropsObj ) );

		var somePropsFailed = false;

		for ( var m = 0, ml = failedPropsArr.length; m < ml; m++ ) {
			if ( failedPropsArr[ m ].propName ) {
				somePropsFailed = true;
				break;
			}
		}

		if ( somePropsFailed ) {
			arrToLog.push( "", loggingStrings.failed, "", );

			for ( var m = 0, ml = failedPropsArr.length; m < ml; m++ ) {
				for ( var n = 0, nl = failedPropsArr[ n ].strings.length; n < nl; n++ ) {
					var failedInComp = failedPropsArr[ m ].strings[ n ].compName;
					var failedOnLayer = failedPropsArr[ m ].strings[ n ].layerName;
					var failedSyntax = failedPropsArr[ m ].updated;
					var failedProp = failedPropsArr[ m ].strings[ n ].propName;

					addProps( failedPropsObj, [ failedInComp, failedOnLayer, failedSyntax ], failedProp );
				}
			}

			arrToLog.push( createLogStrings( failedPropsObj ) );

			/* Uncomment next line to output .json log of  expression properties which failed to update. */
			// logNextToProject( JSON.stringify( failedPropsObj, null, "\t" ), "Failed Expressions.json" );
		}

		logNextToProject( arrToLog.join( "\n" ), [ loggingStrings.logSuffix, ".txt" ].join("") );
	}

	function createLogStrings( obj ) {
		var loggingStrings = {
			comp: localize("$$$/AE/Script/UpdateLegacyExpressions/LogCompTitle=Composition:"),
			layer: localize("$$$/AE/Script/UpdateLegacyExpressions/LogLayerTitle=Layer:"),
			property: localize("$$$/AE/Script/UpdateLegacyExpressions/LogPropTitle=Property:"),
			deprecated: localize("$$$/AE/Script/UpdateLegacyExpressions/LogDeprecatedStr=had deprecated syntax updated"),
			ifelse: localize("$$$/AE/Script/UpdateLegacyExpressions/LogIfElseStr=had a single-line if...else updated"),
			thisL: localize("$$$/AE/Script/UpdateLegacyExpressions/LogThisStr=had \"this\" replaced by \"thisLayer\""),
			sourceT: localize("$$$/AE/Script/UpdateLegacyExpressions/LogSourceTextStr=had Source Text index references updated"),
			fnDeclar: localize("$$$/AE/Script/UpdateLegacyExpressions/LogFuncDeclare=had function declarations moved to the top"),
		}

		var arrForStrings = [];

		var buildStr;

		for ( var i in obj ) {
			arrForStrings.push( [
				loggingStrings.comp,
				i,
			].join( " " ) );

			for ( var j in obj[ i ] ) {
				arrForStrings.push( [
					"\t",
					loggingStrings.layer,
					j,
				].join( " " ) );

				for ( var k in obj[ i ][ j ] ) {
					switch ( k ) {
						case "updatedToCamel":
							buildStr = loggingStrings.deprecated;
							break;

						case "singleLineIfElse":
							buildStr = loggingStrings.ifelse;
							break;

						case "thisParenToThisLayer":
						case "thisDotToThisLayer":
							buildStr = loggingStrings.thisL;
							break;

						case "sourceTextArray":
							buildStr = loggingStrings.sourceT;
							break;

						case "hoistFunctions":
							buildStr = loggingStrings.fnDeclar;
							break;

						default:
							return "";
					}

					arrForStrings.push( [
						"\t\t",
						loggingStrings.property,
						obj[ i ][ j ][ k ],
						buildStr,
					].join( " " ) );
				}
			}

			arrForStrings.push( "" );
		}

		return arrForStrings.join( "\n" );
	}

	function logNextToProject( stringToLog, fileSuffix ) {
		var projLocation = app.project.file;

		var projName = projLocation.displayName;

		var logFileFullPath = [
			projLocation
			.parent
			.fsName,
			"/",
			projName.slice( 0, projName.length - 4 ),
			" - ",
			fileSuffix,
		].join( "" );

		var logFile = new File( logFileFullPath );

		var loggedFile = writeToEndOfFile( logFile, stringToLog, "e" );

		return loggedFile;
	}

	function writeToEndOfFile( fileObj, fileContent, writeType, encoding ) {
		encoding = ( encoding !== undefined ) ? encoding : "utf-8";
		fileObj = ( fileObj instanceof File ) ? fileObj : new File( fileObj );

		var parentFolder = fileObj.parent;

		if ( !parentFolder.exists && !parentFolder.create() ) {
			var noParentErr = localize("$$$/AE/Script/UpdateLegacyExpressions/CannotCreateFileErr=Cannot create file in path"); // needs localization

			throw new Error( [
				noParentErr,
				fileObj.fsName
			].join( " " ) );
		}

		fileObj.encoding = encoding;
		fileObj.open( writeType, "TEXT" );
		fileObj.seek( 0, 2 );
		fileObj.writeln( fileContent );
		fileObj.close();

		return fileObj;
	}

	function writingFilesEnabled() {
		var errStrings = {
			errLineOne: localize("$$$/AE/Script/UpdateLegacyExpressions/SecurityPrefErrLineOne=Logging requires the scripting security preference to be set."),
			errLineTwoStart: localize("$$$/AE/Script/UpdateLegacyExpressions/SecurityPrefLineTwoStart=Go to the"),
			errLineTwoEnd: localize("$$$/AE/Script/UpdateLegacyExpressions/SecurityPrefLineTwoEnd=section of your application preferences, and make sure that \"Allow Scripts to Write Files and Access Network\" is checked."),
			sectionGeneral: localize("$$$/AE/Script/UpdateLegacyExpressions/SecurityPrefGeneral=\"General\""),
			sectionScripting: localize("$$$/AE/Script/UpdateLegacyExpressions/SecurityPrefScriptExp=\"Scripting & Expressions\"")
		}

		var version12Check = (
			parseFloat( app.version ) > 12.0 ||
			( parseFloat( app.version ) === 12.0 &&
				app.buildNumber >= 264 ) ||
			app.version.substring( 0, 5 ) !== "12.0x" );

		var mainSectionStr = ( version12Check ) ? "Main Pref Section v2" : "Main Pref Section";

		var version16Check = ( parseFloat( app.version ) > 16.0 );

		var securitySetting = app.preferences.getPrefAsLong( mainSectionStr, "Pref_SCRIPTING_FILE_NETWORK_SECURITY" );

		var errSecuritySetting = [
			errStrings.errLineOne,
			[ errStrings.errLineTwoStart, ( version16Check ) ? errStrings.sectionScripting : errStrings.sectionGeneral, errStrings.errLineTwoEnd ].join( " " )
		].join( "\n" )

		if ( securitySetting === 0 ) {
			alert( errSecuritySetting );
			( version16Check ) ? app.executeCommand( 3131 ): app.executeCommand( 2359 ); // Would this be better as a menu string? May need localization in that case
		}

		return ( securitySetting === 1 );
	}

} )( this );