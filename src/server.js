const app = require('./app');
const { PORT } = require.apply('./config');

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
});