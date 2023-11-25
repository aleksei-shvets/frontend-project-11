# [RSS aggregator]

## Go to app >>>(<https://rss-aggregtor-al-shvets.vercel.app/>)

Name | Badge
:-----: | :----:
Hexlet tests and linter status | [![Actions Status](https://github.com/aleksei-shvets/frontend-project-11/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/aleksei-shvets/frontend-project-11/actions)
Code Climate | [![Maintainability](https://api.codeclimate.com/v1/badges/67e0356c794b61de0645/maintainability)](https://codeclimate.com/github/aleksei-shvets/frontend-project-11/maintainability)

### Description

This is a web application designed to connect RSS feeds and preview posts from them.
To use the application, you need to insert a link to the RSS stream in the input field and click the "Add" button. The application will load the entire current list of posts of the specified stream and will automatically update the stream every 5 seconds, adding new posts at the top of the list.
When you click on the post link, the app will open the source page with the full content.
All previewed posts and clicked links will be highlighted in color
An unlimited number of RSS streams can be connected to the application, each of them will be automatically updated.

#### The following libraries are used in this project

* @popperjs/core 2.11.8
* axios 1.6.0
* bootstrap 5.3.2
* i18next 23.6.0
* lodash.uniqueid 4.0.1
* on-change 4.0.2
* yup 1.3.2
