(function($) {
$(document).ready(function() {
	var noteColors = ['#fff799', '#edbd83', '#d8fe87', '#a3fd70', '#97f1fe', '#97f1fe', '#bfa2ff', '#e1a1ff', '#f8f8f8', '#cdcdcd']; 
	
	var initSearchText = true;
	
	var undoStack = []; 
	
	var noteList = $('ul#notes').first(); 
	
	var searchMode = false;
	
	var db;
	initDB();
	
	// $(window).unload(function() {
	// 		
	// 	});
	
	// Load notes 
	search(false);
	
	$(document).keyup(function(event) {
		// new note
		if(event.ctrlKey) {
			
			switch(event.keyCode) {
				case 78:
					$('a#add-link').click(); 
					break; 
				case 90:
					undo(); 
					break;
				case 83:
					$("#search-text").focus(); 
			}
		}
	})
	
	$(window).resize(function() {
		center($('#fullview'));
	});
	
	$('a#add-link').click(function() {
		var note = noteobj(); 
		
		execQuery("SELECT MAX(id) AS LastID FROM notes" , function(tx, results) {
			var lastID = results.rows.item(0).LastID;
			id = lastID + 1;
			note.id = id; 
			note.render(); 
			note.ui.addClass('creating')
			setTimeout(function() { 
				note.ui.removeClass('creating');
				note.ui.find('.content').focus();
			}, 1);
		});
		
		
	});
	
	$('a#undo-link').click(function() {
		undo(); 
	});
	
	noteList.sortable({
		handle: 'div.drag-handle',
		stop: function(event, ui) {
			// save sort values
			$('li.note').each(function() {
				var li = $(this);
				var id = li.find('input.note-id').val();
				execQuery("UPDATE notes SET sort = " + li.index() + " WHERE id = " + id); 
			});
		}
	});
	
	$("#search-text").keyup(function(event) {
		if(event.keyCode == 13) {
			var keywords = $(this).val().replace("'", "''"); 
			search(keywords);
			$("#clear-search").show(); 
		}
		else if(event.keyCode == 27) {
			$('a#clear-search').click(); 
		}
	});
	
	// clear search 
	$('a#clear-search').click(function() {
		search(false);
		$(this).hide(); 
		$("#search-text").val('');
	});
	
	// Tag
	$('a.tag').live('click', function() {
		var text = '#' + $(this).text();
		$("#search-text").val(text);
		search(text);
		$("#clear-search").show(); 
		$("#search-text").focus(); 
		
		return false;
	});
	
	
	
	/****************************************************************
	 * Full view
	 ****************************************************************/
	$('#fullview').delegate('.actions a', 'click', function() {
		$('#fullview-wrapper').removeClass('show');
		setTimeout(function() { $('#fullview-wrapper').fadeOut(); }, 2000);
	});
	
	/****************************************************************
	 * Base 
	 ****************************************************************/
	function noteobj() {
		var self = new Object(); 
		self.id = null; 
		self.text = ''; 
		self.ui = null; 
		self.flagged = 0; 
		self.color = noteColors[0];
		self.sort = false; 
		
		self.render = function() {
			var flagClass = ''; 
			var oldNoteClass = ''; 
			
			if(self.id === null) self.id = '';
			if(self.flagged) flagClass = 'flagged';
			console.log(self.age);
			if(self.age > 7) {
				console.log('...');
				oldNoteClass = "old";
			}

			self.ui = $('<li class="note ' + flagClass + ' ' + oldNoteClass + '"><input type="hidden" class="note-id" value="' + self.id + '"><div class="content-wrapper"><div class="drag-handle" /><div class="content" contenteditable="true">' + self.text + '</div></div></li>');

			self.ui.find('.content-wrapper').css('background-color', self.color)
			
			var controls = $('<p class="actions"><a href="#" class="flag">Flag</a><a href="#" class="settings">Settings</a><a href="#" class="delete">Delete</a></p>'); 
			self.ui.append(controls);
			
			// var deleteConfirmation = $('<div class="delete-confirmation"><a href="#" class="delete-cancel">Cancel</a><a href="#" class="delete-ok">OK</a><div>');
			// 			self.ui.find('.content-wrapper').append(deleteConfirmation);
			
			var flag = $('<div class="flag"></div>');
			self.ui.find('.content-wrapper').prepend(flag);
			
			var settings = $('<div class="panel-settings"><p>Colors:</p></div>');
			var colors = $('<p><span class="color color1" /><span class="color color2" /><span class="color color3" /><span class="color color4" /><span class="color color5 last" /></p><p><span class="color color6" /><span class="color color7" /><span class="color color8" /><span class="color color9" /><span class="color color10 last" /></p> <p><a class="goback-link" href="#">Go back</a></p>');
			settings.append(colors);
			self.ui.find('.content-wrapper').prepend(settings);
			
			if(self.sort === false || self.sort == 0) {
				noteList.prepend(self.ui);
			}
			else {
				var noteBefore = noteList.children()[self.sort - 1];
				console.log(noteBefore);
				self.ui.insertAfter(noteBefore);
			}
			
			for(var i = 0; i < noteColors.length; i++) {
				$('div.panel-settings span.color' + (i + 1)).css('background-color', noteColors[i]);
			}
			
			/**************************************************************
			 * Event handlers 
			 **************************************************************/ 
			
			// Blur => save note
			self.ui.delegate('.content', 'blur', function() {
				self.ui.find('.content-wrapper').removeClass('focus'); 
				self.text = $(this).html();
				if(self.ui.hasClass('changed')) {
					self.save(); 
					self.ui.removeClass('changed')
				}
			}); 
			
			// content focus => save note
			self.ui.delegate('.content', 'focus', function() {
				self.ui.find('.content-wrapper').addClass('focus'); 
			});
			
			// Double-click => quick-edit note
			self.ui.delegate('.content', 'dblclick', function() {
				$(this).attr('contenteditable', true);
				$(this).focus();
			});
			
			// keyup
			self.ui.delegate('.content', 'keyup', function(event) {
				self.ui.addClass('changed'); 
				
				if(event.keyCode === 13) {
					// Go to full edit mode/screen
					return false;
				}
			});
			
			// delete 
			self.ui.delegate('p.actions a.delete', 'click', function(event) {
				self.remove(); 
				return false;
			});
			
			// delete 
			self.ui.delegate('p.actions a.flag', 'click', function(event) {
				self.flag(); 
				return false;
			});
			
			// settings
			self.ui.delegate('p.actions a.settings', 'click', function(event) {
				self.settings(); 
				return false;
			});
			
			// close setting
			self.ui.delegate('a.goback-link', 'click', function(event) {
				self.ui.find('.content-wrapper').removeClass('flip');
				self.ui.find('.content-wrapper').addClass('flip-back');
				setTimeout(function() { self.ui.find('.content-wrapper').removeClass('flipped'); }, 500);
			}); 
			
			// more
			self.ui.delegate('p.actions a.more', 'click', function(event) {
				$('#fullview-wrapper').fadeIn(function() {
					center($('#fullview'));
					$('#fullview-wrapper').addClass('show');
				});
				return false;
			});
			
			// color settings
			self.ui.delegate('div.panel-settings span.color', 'click', function(event) {
				var color = $(this).css('background-color');
				self.setBackgroundColor(color);
			});
		}
		
		/**************************************************************
		 * Note object operations
		 **************************************************************/
		
		self.save = function() {
			console.log('...');
			var flag = 0; 
			if (self.flagged == true || self.flagged == 1) {
				flag = 1; 
			}
			else {
				flag = 0;
			}
			
			self.text = parse(self.text);
			self.ui.find('.content').html(self.text);
			
			var query = "UPDATE notes SET text = '" + self.text + "',"; 
			query += "modified = '" + new Date() + "',";
			query += "sort = " + self.ui.index() + ", ";
			query += "flag = " + flag + ", ";
			query += "color = '" + self.color + "'";
			query += " WHERE id = " + self.id;
			
			execQuery(query, 
				function(tx, results) {
					if(results.rowsAffected == 1) {
						//console.log('Note ' + self.id + ' saved.');
					}
					else {
						execQuery("INSERT INTO notes(id, text, created, modified, flag, color) VALUES(" + self.id + ", '" + self.text + "', '" + new Date() + "', '" + new Date() + "', " + self.flagged + ", '" +  self.color + "')");
						//console.log('Note ' + self.id + ' added.');
					}
				}
			);
		}
		
		self.remove = function() {
			execQuery("DELETE FROM notes WHERE id = " + self.id); 	
			setTimeout(function() { self.ui.remove(); }, 1000); 	
			self.ui.find('.content-wrapper').addClass('deleting');
			self.sort = self.ui.index();

			undoStack.push(self); 
			
			updateUndoLink();
		}
		
		self.flag = function() {
			if(self.flagged != 1) {
				self.flagged = 1;
			}
			else {
				self.flagged = 0;
			}
			
			self.save(); 
			self.ui.toggleClass('flagged');
		}
		
		self.settings = function() {
			self.ui.find('.content-wrapper').addClass('flip');
			self.ui.find('.content-wrapper').removeClass('flip-back'); 
			setTimeout(function() { self.ui.find('.content-wrapper').addClass('flipped'); }, 500);
		}
		
		self.setBackgroundColor = function(color) {
			self.color = color;
			
			self.save(); 
	
			self.ui.find('.content-wrapper').css('background-color', color);
			self.ui.find('.content-wrapper').addClass('flip-back');
			setTimeout(function() { 
				self.ui.find('.content-wrapper').removeClass('flip'); 
				self.ui.find('.content-wrapper').removeClass('flipped'); 
				}, 
				500
			);
		}
		
		return self; 
	}
	
	/**************************************************************
	 * Helper function 
	 **************************************************************/
	function center(element) {
		var docWidth = $(document).width();
		var fullviewWidth = element.width(); 
		var fullviewLeft = (docWidth - fullviewWidth) / 2; 
	
		element.css({'left': fullviewLeft + 'px'});
	}
	
	function undo() {
		var note = undoStack.pop(); 
		note.render(); 
		note.ui.find('.content-wrapper').addClass('deleting');
		setTimeout(function() { 
			note.ui.find('.content-wrapper').addClass('undeleting'); 
			setTimeout(function() { note.ui.find('.content-wrapper').removeClass('deleting').removeClass('undeleting') } , 2000); 
		}, 1);
		note.save(); 
		
		updateUndoLink();
	}
	
	function resizeMedia(element) {
		element.find('img').each(function() {
			if($(this).width() > 200) $(this).width(200); 
		}); 
	}
	
	function updateUndoLink() {
		var undoLink = $('a#undo-link'); 
		if(undoStack.length > 0) {
			console.log('...');
			undoLink.removeClass('disabled');
		}
		else {
			undoLink.addClass('disabled');
		}
	}
	
	function search(keywords) {
		if(keywords == false) keywords = '';
		
		keywords = parse(keywords + '');
		
		var query = "SELECT * FROM notes WHERE text LIKE '%" + keywords + "%' ORDER BY sort DESC"; 
		if(keywords === '') query = "SELECT * FROM notes ORDER BY sort DESC";
		
		execQuery(query, function(tx, results) {
			$('li.note').fadeOut();
			
			setTimeout(function() {
				for(var i=0; i < results.rows.length; i++) {
					var note = noteobj(); 
					note.id = results.rows.item(i).id;
					note.text = results.rows.item(i).text;
					note.color = results.rows.item(i).color;
					note.modified = results.rows.item(i).modified;
					if(results.rows.item(i).flag == 1) note.flagged = true; 
					// age in days
					note.age = (new Date() - new Date(note.modified)) / 86400000;

					note.render(); 
				
				}
			}, 200);
		});
	}
	/****************************************************************
	 * Local database functionalities 
	 ****************************************************************/ 
	
	/**
	 * Using script-level db variablie, declared at the top of the file
	 * Return database object
	 */
	function initDB() {
		db = openDatabase("Anynote", "1.0", "Database for Anynote application", 200000);
		// create tables and igore the error if the tables already exist
		execQuery("CREATE TABLE notes (id REAL UNIQUE, created DATE, modified DATE, text TEXT, sort INTEGER, flag BOOLEAN default 0, deleted BOOLEAN default 0, color TEXT)");
	}
	
	function getNewIDFor(model) {
		var newID = null;
		execQuery("SELECT MAX(id) AS LastID FROM " + model , function(tx, results) {
			var lastID = results.rows.item(0).LastID;
			id = lastID + 1;
		}); 
	}
	
	function execQuery(query, resultCallback, errorCallback) {
		if(errorCallback === undefined) errorCallback = function(tx, error) {
			console.log(error.message + " - " + "\"" + query + "\"");
		}; 
		
		db.transaction(function(tx) {
			tx.executeSql(
				query, 
				[], 
				resultCallback, 
				errorCallback
			);
		});
	}
	
	function parse(text) {
		var imageReg = [/[^"](http:\/\/[^<>]*\.png)/g, /[^"](http:\/\/[^<>]*\.jpg)/g, /[^"](http:\/\/[^<>]*\.gif)/g]; 
		
		var videoReg = [/[^"](http:\/\/[^<>]*\.ogv)/g, /[^"](http:\/\/[^<>]*\.mp4)/g, /[^"](http:\/\/[^<>]*\.mov)/g]; 
		
		var audioReg = [/[^"](http:\/\/[^<>]*\.mp3)/g, /[^"](http:\/\/[^<>]*\.m4a)/g, /[^"](http:\/\/[^<>]*\.ogg)/g]; 
		
		var tagReg = /#([a-zA-Z0-9-]*)/g; 
	
		for(var i=0; i<imageReg.length; i++) {
			text = text.replace(imageReg[i], '<img src="$1" />'); 
		}
		
		for(var i=0; i<videoReg.length; i++) {
			text = text.replace(videoReg[i], '<video src="$1" controls="controls" />'); 
		}
		
		for(var i=0; i<audioReg.length; i++) {
			text = text.replace(audioReg[i], '<audio src="$1" controls="controls" />'); 
		}
		
		text = text.replace(tagReg, '<a href="" class="tag">$1</a>'); 
		
		return text; 
	}

});
})(jQuery);