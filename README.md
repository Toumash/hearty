# Hearty ❤ ![Heroku](https://pyheroku-badge.herokuapp.com/?app=hearty-app&style=flat-square)


##  Goal

This app for lovers has only one goal: to make each other happier by telling the significant other that you think about him/her.


## Tech stack

- nodejs
- socket.io
- mongodb - atlas
- web service workers
- heroku

## How to run?

### Requirements
`mongodb` installed somewhere.

I personally recommend installing it using docker.
If you are running mongodb in another location - please change .env file accordingly

```
docker run --network=host -p 27017:27017 mongo
```

```
npm install
npm start
```

## Deployment How to

1. [Install heroku cli](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)
2. Run the script

```
heroku create
heroku features:enable http-session-affinity
heroku config:set PUBLIC_URL=xxx PORT=80 VAPID_PRIV=xxx VAPID_PUB=xxx
git push heroku master
```

## Deployment - prod

1. Clone the repo
2. Install heroku cli
3. Run this script

```
heroku login
heroku git:remote --app hearty-app
git push heroku master
```
