# Hearty ❤


##  Goal

This app for lovers has only one goal: to make each other happier by telling the significant other that you think about him/her.


## Tech stack

- nodejs
- socket.io
- mongodb - atlas
- web service workers
- heroku

## How to run?

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
