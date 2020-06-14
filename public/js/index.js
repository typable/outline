import app from './app.js';

const GOOGLE_API_KEY = 'QUl6YVN5QzZVcFRpNVlYc1h6eFJ2aEo4Z1RWbnJtTkpCQ2JCMjBn';

window.addEventListener('load', function(event) {

	if(typeof firebase !== 'undefined') {
		firebase.initializeApp({
			apiKey: atob(GOOGLE_API_KEY),
			authDomain: "typable-website.firebaseapp.com",
			databaseURL: "https://typable-website.firebaseio.com",
			projectId: "typable-website",
			storageBucket: "typable-website.appspot.com",
			messagingSenderId: "1097239723234",
			appId: "1:1097239723234:web:a9b8491f4778f46b96f2bb",
			measurementId: "G-6881VEFYTQ"
		});
		firebase.analytics();
		firebase.performance();
	}

	app.init();
});
