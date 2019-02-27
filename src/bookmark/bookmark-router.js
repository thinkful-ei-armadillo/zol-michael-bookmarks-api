'use strict';
const express    = require('express');
const uuid       = require('uuid/v4');
const {isWebUri} = require('valid-url');
const logger     = require('../logger');
const store      = require('../store');
const BookmarksService = require('./bookmarks-service');
const xss        = require('xss');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const serializeBookmarks = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating)
});

bookmarkRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmarks));
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    for(const field of ['title', 'url', 'rating']){
      if(!req.body[field]){
        logger.error(`${field} is required`);
        return res
          .status(400)
          .send(`${field} is required`);
      }
    }
    const {title, url, description, rating} = req.body;

    if(!Number.isInteger(rating) || rating < 0 || rating > 5){
      logger.error('Invalid rating');
      return res
        .status(400)
        .send('Invalid rating');
    }

    if(!isWebUri(url)){
      logger.error('Invalid URL');
      return res
        .status(400)
        .send('Invalid URL');
    }

    const bookmark = {title, url, description, rating};

    BookmarksService.createBookmark(
      req.app.get('db'),
      bookmark
    )
      .then(bookmark => {
        logger.info(`Bookmark created`)
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(serializeBookmarks(bookmark))
      })
      .catch(next)
  });

bookmarkRouter
  .route('/bookmarks/:bookmark_id')
  .all((req, res, next) => {
    const {bookmark_id} = req.params;
    BookmarksService.getBookmarkById(req.app.get('db'), bookmark_id)
      .then(bookmark => {
        if(!bookmark){
          logger.error('Bookmark not found');
          return res
            .status(404)
            .json({
              error: {message: 'Bookmark not found'}
            });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next)
  })
  .get((req, res) => {
    res.json(serializeBookmarks(res.bookmark))
  })
  .delete((req, res, next) => {
    const {bookmark_id} = req.params;
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      bookmark_id
    )
      .then(data => {
        logger.info(`Bookmark deleted`)
        res.status(204).end()
      })
      .catch(next)
  });

module.exports = bookmarkRouter;