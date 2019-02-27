'use strict';
const express    = require('express');
const uuid       = require('uuid/v4');
const {isWebUri} = require('valid-url');
const logger     = require('../logger');
const  bookmarks = require('../store');
const BookmarksService = require('./bookmarks-service');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const serializeBookmarks = bookmark => ({
  id: bookmark.id,
  title: bookmark.title,
  url: bookmark.url,
  description: bookmark.description,
  rating: Number(bookmark.rating)
});

bookmarkRouter
  .route('/bookmarks')
  .get((req, res) => {
      BookmarksService.getAllBookmarks(req.app.get('db'))
        .then(bookmarks => {
          res.json(bookmarks.map(serializeBookmarks))
        })
  })
  .post(bodyParser, (req, res) => {
    for(const field of ['title', 'url', 'rating']){
      if(!req.body[field]){
        logger.error(`${field} is required`)
        return res
          .status(400)
          .send(`${field} is required`)
      }
    }
    const {title, url, description, rating} = req.body;

    if(!Number.isInteger(rating) || rating < 0 || rating > 5){
      logger.error(`Invalid rating`);
      return res
        .status(400)
        .send(`Invalid rating`)
    }

    if(!isWebUri(url)){
      logger.error(`Invalid URL`)
      return res
        .status(400)
        .send(`Invalid URL`)
    }

    const bookmark = {id: uuid(), title, url, description, rating}

    store.bookmarks.push(bookmark);

    logger.info(`bookmark with id ${id} created`);

    res
      .status(201)
      .location(`/http://localhost:8000/bookmarks/${id}`)
      .json(bookmark);
});

bookmarkRouter
  .route('/bookmarks/:bookmark_id')
  .get((req, res) => {
    const {bookmark_id} = req.params
    BookmarksService.getBookmarkById(req.app.get('db'), bookmark_id)
      .then(bookmark => {
        if(!bookmark){
          logger.error(`Bookmark not found`)
          return res
            .status(404)
            .json({
              error: {message: `Bookmark not found`}
            })
        }
        res.json(serializeBookmarks(bookmark))
      })
  })
  .delete((req, res) => {
    const {bookmark_id} = req.params
    const bookmarkIdx = store.bookmarks.findIdx(b => b.id === bookmark_id)

    if(bookmarkIdx === -1){
      logger.error(`Bookmark not found`)
      return res
        .status(404)
        .send(`Bookmark not found`)
    }

    store.bookmarks.splice(bookmarkIdx, 1)

    logger.info(`Bookmark deleted`)
    res
      .status(204)
      .end()
  })

module.exports = bookmarkRouter;