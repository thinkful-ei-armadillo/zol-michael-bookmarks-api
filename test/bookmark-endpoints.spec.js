'use strict';
// const { supertest } = require('supertest');
const knex = require('knex');
const fixtures = require('./bookmark-fixtures');
const app = require('../src/app');

describe('Bookmark Endpoints', () => {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  
  before('clean table', () => db('bookmarks').truncate());
  afterEach('clean table', () => db('bookmarks').truncate());

  describe('GET /bookmarks', () => {
    context('Given no bookmarks', () => {
      it('responds with 200 & empty list', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context('Given bookmarks in database', () => {
      const testBookmarks = fixtures.makeBookmarkArray();
            
      beforeEach('insert bookmark', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('gets the bookmarks from the store', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks);
      });
    });
  });

  describe('GET /bookmarks/:id', () => {
    context('Given no bookmarks', () => {
      it('responds 404 when bookmark doesn\'t exist', () => {
        const id = 1;
        return supertest(app)
          .get(`/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: {message: 'Bookmark not found'}
          });
      });
    });

    context('Given bookmarks in database', () => {
      const testBookmarks = fixtures.makeBookmarkArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 200 and bookmark', () => {
        const bookmarkId = 3;
        const expected = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expected);
      });
    });
  });

  describe('DELETE /bookmarks/:id', () => {
    context('Given no bookmarks', () => {
      it('responds 404 when no bookmarks', () => {
        const id = 1;
        return supertest(app)
          .delete(`/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: {message: 'Bookmark not found'}
          });
      });
    });

    context('Given bookmarks in database', () => {
      const testBookmarks = fixtures.makeBookmarkArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('removes bookmark by id from store', () => {
        const delId = 2;
        const expected = testBookmarks.filter(b => b.id !== delId);
        return supertest(app)
          .delete(`/bookmarks/${delId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() => {
            supertest(app)
              .get('/bookmarks')
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expected);
          });
      });
    });
  });

  describe('POST /bookmarks', () => {
    it('responds with 400 if title not supplied', () => {
      const bookmarkNoTitle = {
        // title: 'title',
        url: 'http://test.com',
        rating: 1
      };
      return supertest(app)
        .post('/bookmarks')
        .send(bookmarkNoTitle)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: {message: 'title is required'}
        });
    });  

    it('responds with 400 if url not supplied', () => {
      const bookmarkNoUrl = {
        title: 'test title',
        // url: none,
        rating: 1
      };
      return supertest(app)
        .post('/bookmarks')
        .send(bookmarkNoUrl)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: {message: 'url is required'}
        });
    });
    
    it('responds with 400 if url not valid', () => {
      const bookmarkInvalidUrl = {
        title: 'test title',
        url: 'invalid',
        rating: 1
      };
      return supertest(app)
        .post('/bookmarks')
        .send(bookmarkInvalidUrl)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: {message: 'url is invalid'}
        });
    });

    it('responds with 400 if rating not supplied', () => {
      const bookmarkNoRating = {
        title: 'test title',
        url: 'http://test.com',
        // rating: none
      };
      return supertest(app)
        .post('/bookmarks')
        .send(bookmarkNoRating)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: {message: 'rating is required'}
        });
    });

    it('responds with 400 if rating is not between 0 and 5', () => {
      const bookmarkInvalidRating = {
        title: 'test title',
        url: 'http://test.com',
        rating: 'invalid'
      };
      return supertest(app)
        .post('/bookmarks')
        .send(bookmarkInvalidRating)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: {message: 'rating is invalid'}
        });
    });

    it('adds new bookmark to store', () => {
      const newBookmark = {
        title: 'test title',
        url: 'http://test.com',
        description: 'test desc',
        rating: 1
      };
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
        })
        .then(res => {
          supertest(app)
            .get(`/bookmarks/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body);
        });
    });
  });
});