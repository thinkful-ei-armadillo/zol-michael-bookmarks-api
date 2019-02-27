'use strict';
const BookmarksService = {

  getAllBookmarks(knex){
    return knex
      .select('*')
      .from('bookmarks');
  },

  getBookmarkById(knex, id){
    return knex
      .select('*')
      .from('bookmarks')
      .where('id', id)
      .first();
  },

  createBookmark(knex, newBookmark){
    return knex
      .insert(newBookmark)
      .into('bookmarks')
      .returning('*')
      .then(data => data[0]);
  },

  deleteBookmark(knex, id){
    return knex('bookmarks')
      .where({id})
      .delete();
  },

  updateBookmark(knex, id, newField){
    return knex('bookmark')
      .where({id})
      .update(newField);
  }

};

module.exports = BookmarksService;