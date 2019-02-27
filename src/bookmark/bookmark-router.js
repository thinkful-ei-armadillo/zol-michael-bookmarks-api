const express    = require('express');
const uuid       = require('uuid/v4');
const logger     = require('../logger');
const  bookmarks = require('../store');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route('/bookmarks')
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, content } = req.body;

    if (!title) {
      logger.error('Title is required');
      return res
        .status(400)
        .send('Invalid data');
    }
    
    if (!content) {
      logger.error('Content is required');
      return res
        .status(400)
        .send('Invalid data');
    }
    const id = uuid();
    const bookmark = {id, title, content};

    bookmarks.push(bookmark);
  
    logger.info(`bookmark with id ${id} created`);

    res
      .status(201)
      .location(`/http://localhost:8000/bookmarks/${id}`)
      .json(bookmark);

  });

bookmarkRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(b => b.id === id);

    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Bookmark Not Found');
    }
    
    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(b => b.id === id);

    bookmarks.splice(bookmarkIndex, 1);

    res
      .status(204)
      .end();
  });

module.exports = bookmarkRouter;