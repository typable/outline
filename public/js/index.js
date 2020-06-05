import app from './app.js';

window.addEventListener('load', function(event) {

	if(typeof firebase !== 'undefined') {
		firebase.initializeApp({
			apiKey: app.verify(),
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
