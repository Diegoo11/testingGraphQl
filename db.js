import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://ynoacamino:11yenaro11@graphql.n4a5qyu.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('conectado');
  }).catch((error) => {
    console.error('error conection mongodb', error.message);
  });
