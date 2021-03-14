# Heart SMS - Vue.js Web App

Heart is a fork of Pulse SMS.

The Pulse community was pretty great. This web app started out as a [third party, alternative client](https://github.com/Serubin/PulseClient), to the official Pulse SMS web app. It is built on [Vue.js](https://vuejs.org/). Big thanks to [Solomon Rubin](https://github.com/Serubin) for creating an awesome base.

This version of the web app is a fork of the official web app. As an open-source client, anyone is free to contribute and help improve the Heart experience. This web app has improved performance/load times, a cleaner architecture, and new features. It will be much easier to work with and improve, than the legacy web app.

Before you will be able to use this, you should create a Heart account from the [Android app](https://github.com/tnyeanderson/heart-sms-android). To use this web app, you have should build and run the web app locally, or deploy it to your own hosting location, using the build steps below.


## Deploy to production.

If you are trying to deploy into production, you should follow the [Getting Started](https://github.com/tnyeanderson/heart-sms-backend/blob/main/docs/getting-started.md) guide for [heart-sms-backend](https://github.com/tnyeanderson/heart-sms-backend). The production stack has the `heart-sms-web` included. 

**If you want to deploy only the webapp (perhaps your backend is on a different server for some reason), follow the steps below.**

Clone the repo or just copy the `docker-compose.yml` and `Caddyfile`.

Make a copy of `.api.env.example` named `.api.env` in the same directory as your `docker-compose.yml`.

Open `.api.env` in your editor of choice and change the URLs to match your production URLs.

In production, `HEART_USE_SSL` *must* be true and there should be hostnames instead of IPs for your production backend. If using the Caddyfile provided, the `HEART_API_URL` and `HEART_WEBSOCKETS_URL` are the same (example: `api.heart.lan`).

Then, start the container:

```
docker-compose up -d
```

Edit the `Caddyfile` with your production url and certificate paths. Then, start caddy (or run it as a service):

```
caddy run
```


## Build for development

*You must have your backend development environment set up first. See [this guide](https://github.com/tnyeanderson/heart-sms-backend/blob/main/CONTRIBUTING.md)*

To use the docker, development environment, see [Building docker container](#building-docker-container)

Create a file at `public/config/web-config.js` and paste the following content: 
```
var heartConfig = {
    api: {
        baseUrl: "api.heart.lan",
        websocketsUrl: "api.heart.lan",
        useSSL: true
    }
}
```

Getting up and running is very easy. You will need `npm` installed:

```
# install the dependencies
npm install

# start the server at localhost:8081
npm run start-dev
```

The `start-dev` command will serve a local version of the app. The local version of the web app will still use the same backend endpoints from `public/web-config.json`, so no additional configuration is required.

You can access the interface at `https://web.heart.lan` or `http://localhost:8081`.

**If you get CORS errors in your console.log**

Visit `https://api.heart.lan` in your browser and accept the certificate. Then reload the web interface and try again.


## Building docker container

Even though the `heartsms/heart-sms-web` container is available on Docker Hub, I don't have CI/CD yet, so they might be outdated. If you are testing (or just want your own), you can build the docker image yourself.

From project root, run:
```
npm run docker:build
```

This will create an image tagged `heartsms/heart-sms-web:dev`.

Then you can run the dev container:
```
npm run docker:start-dev
```


## Contributing

Please fork this repository and contribute back using [pull requests](https://github.com/tnyeanderson/heart-sms-web/pulls). Features can be requested using [issues](https://github.com/tnyeanderson/heart-sms-web/issues) on the Heart SMS issue tracker/roadmap. I know there are some issues on this repo, right now. They will be migrated (or finished), as the app moves in to the production state.

Any code, comments, and critiques are appreciated.


### Heart Experiments

*The following was written by Luke Klinker*

From an end-user perspective, I am not a big fan of just filling out the settings menu. Little "tweak" preferences that the majority of users will not find helpful, probably will not be added to the app. Making new preferences means a much higher overhead for new users, and a more complicated experience for current users. Many users will not understand "one-off" preferences and they will just confuse them, which is a bad user experience.

However, as an open source app, I want developers to be able to customize their experince, the way they want. I have made a `/experiments` page that can hold any number of settings and preferences that other people want to add into the app and maintain. If you have a suggestion for the web app, feel free to implement it there, create a PR, then we can test it and roll it out to everyone if it will be useful for the majority of people.

This `/experiments` page will never be advertised to end-users. No one should assume that the preferences there will work or request support on them. This page is simply for developers to test new ideas/concepts that they would like to see in the app. It could also be a good place to A/B test new changes.


## License Information
Licensed Under Apache License Version 2 (Current Primary License) and MIT License. See additional information in the [LICENSE file](./LICENSE)

