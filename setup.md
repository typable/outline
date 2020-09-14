# Outline

## Installation

The following steps are required in order to serve the website locally.

### Deployment

Define the target hosting site for deployment.

```bash
$ firebase target:apply hosting outline-website outline-website
$ firebase deploy --only hosting
```

<!--
### Canvas Module Libraries

The following libraries are required in order to build and execute the *canvas* module properly.

```bash
$ sudo apt-get update
$ sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

Now the node module can be installed.

```bash
$ npm run build
```

### Grant Port Binding

The following command makes it for node possible to bind a port beneath *1024*. The command must be execute after every single `apt-get update`.

```bash
$ sudo setcap 'cap_net_bin_service=+ep' `which node`
```

### Grant Certificate Access

The following commands enables node to read from the directories and files generate from *Certbot*.

```bash
$ sudo chmod 0755 /etc/letsencrypt/{live,archive}
$ sudo chmod 0640 /etc/letsencrypt/live/<domain>/privkey.pem
$ sudo chown -R <user>:<user> /etc/letsencrypt/live/<domain>/privkey.pem
```
-->

## Launch

### Frontend

The following command starts the *Firebase Hosting* service, which provides the frontend.

```bash
$ npm run live // Port 80
$ npm run test // Port 8080
```
