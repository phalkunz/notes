# Notes App
This app was written for [SilverStripe HTML5 Jedi Challenge](http://silverstripe.com/blog/html5-jedi-arena-shaping-the-web-of-the-future/) and it won a trophy and a PlayStation 3. 

As the name implies, the app is for note taking. It was designed to require less keystrokes, less mouse movements, less input fields, thus less hassles. Just a reminder, this app was *not* intended to be fully working but rather a proof of concept and a demonstration of some of the HTML5 and CSS3 features. 

You can find the demo here [http://phalkunz.github.com/demo/stickynotes/](http://phalkunz.github.com/demo/notes/). You need *Safari* or at least *Chrome* browser. 

# Browser Compatibilities:
- Safari 
- Google Chrome (doesn't support full visual effects)
- Both of these browsers support deferent movie formats

# Features 
- Local storage (Indexed Database)
- In-note tags. To tag a word, prefix it with # character. For example, #html
- Click anywhere outside of the edited note to save it
- Flag
- Undo deleted notes 
- Keyboard shortcuts
	- Cltr-n – create a new note 
	- Clrt-z – undo a deleted note 
- Aging notes (grungy look), after 7 days
- Transform image, audio, and video links into html elements
	- Supported image formats: png, jpg, gif
	- Supported audio formats: ogv, mp4, mov  
	- Supported video formats: mp3, m4a, ogg (Refer to browser documentations for video format supports)
- Note colors
- Order notes by drag and drop
- Search 
	- Text search 
	- Tag search by either type a tag name with # prefix in the search box or click a tag in a note

# Known Issues
- Edited notes do not get saved when closing/refresh window/tab
- Entering more than video links at the same time will break a note