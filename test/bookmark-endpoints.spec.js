const knex = require('knex');
const fixtures = require('./bookmark-fixtures');
const app = reqiure('../src/app');

describe('Bookmark Endpoints', () => {
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    });

    after('disconnect from db', () => db.destroy());

    describe('GET /bookmarks', () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 & empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, [])
            })
        })

        context(`Given bookmarks in database`, () => {
            const testBookmarks = fixtures.makeBookmarkArray();
            
            beforeEach('insert bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it(`gets the bookmarks from the store`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, testBookmarks)
            })
        })
    })

    describe('GET /bookmarks/:id', () => {
        context(`Given no bookmarks`, () => {
            it(`responds 404 when bookmark doesn't exist`, () => {
                return supertest(app)
                    .get('/bookmarks/asdf')
                    .expect(404, {
                        error: {message: `Bookmark not found`}
                    })
            })
        })

        context(`Given bookmarks in database`, () => {
            const testBookmarks = fixtures.makeBookmarkArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it(`responds with 200 and bookmark`, () => {
                const bookmarkId = 3;
                const expected = testBookmarks[bookmarkId - 1];
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(200, expected)
            })
        })
    })
})