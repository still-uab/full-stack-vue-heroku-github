import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path'; 
import history from 'connect-history-api-fallback'; // add this line after installing the package 'npm install connect-history-api-fallback'

const app = express();
app.use(bodyParser.json());   // bodyParser is used to parse the json response objects

// set path for whatever path you want the front end to request these images on, needs import path from path command above to work.
app.use( '/images', express.static(path.join(__dirname, '../assets')) ); // this says serve assets dir whenever a request is sent on the /images route

app.use( express.static(path.resolve(__dirname, '../dist'), {maxAge: '1y', etag: false}) ) // serve files from dist folder, pass two arguments: one for dir and a config object
app.use(history()); // use history method imported above

/* HELLO EXAMPLES
app.get('/hello', (req, res) => {
    res.send('Hello!'); // res.send is built in response function to send back a response to the client
});  // get request to URL endpoint /hello and pass a callback that gets executed when this route is hit and takes req, res objects as params

app.get('/hello/:name', (req, res) => { 
    res.send(`Hello ${req.params.name}`); // req.params accesses the :name part of the URL in this example, again using template literals. Test in postman via GET request http://localhost:8000/hello/steven
});

app.post('/hello', (req, res) => { 
    res.send(`Hello ${req.body.name}`); // using template literals here
});
*/

app.get('/api/products', async (req, res) => {          // URLs for all end points starts with API. Add async to route callback for mongodb. 
  const client = await MongoClient.connect(             // establish a client connection via MongoClient imported above
    process.env.MONGO_USER && process.env.MONGO_PASS    // check to see if env variables exist, if so, run mongdo atlas connection, if not run on localhost connection
    ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.agwpl.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority` // First argument passed to connect is the localhost mongodb and port
    : 'mongodb://localhost:27017',
    { useNewUrlParser: true, useUnifiedTopology: true} // Configuration object, comptability items that have to be passed to mongo connection
  );
  const db = client.db(process.env.MONGO_DBNAME || 'vue-db-still');   // set variable equal to name of the db you want to connect to, either use env variable or localhost
  const products = await db.collection('products').find({}).toArray(); //query db collection, passing find with empty object for all items. toArray to convert query into an array.
  res.status(200).json(products);   // 200 OK status for client, .json is like .send but spefically for json objects. Pass products array above.
  client.close(); // must be called wherever MongoClient.connect is called
});

app.get('/api/users/:userId/cart', async (req, res) => {    // URLs for all end points starts with API, GETS current cart items for specific user
  const { userId } = req.params; // get user ID from URL param
  const client = await MongoClient.connect(             // establish a client connection via MongoClient imported above
    process.env.MONGO_USER && process.env.MONGO_PASS    // check to see if env variables exist, if so, run mongdo atlas connection, if not run on localhost connection
    ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.agwpl.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority` // First argument passed to connect is the localhost mongodb and port
    : 'mongodb://localhost:27017',                        // First argument passed to connect is the localhost mongodb and port
    { useNewUrlParser: true, useUnifiedTopology: true} // Configuration object, comptability items that have to be passed to mongo connection
  );
  const db = client.db(process.env.MONGO_DBNAME || 'vue-db-still');   // set variable equal to name of the db you want to connect to
  const user = await db.collection('users').findOne({ id: userId });  // make query to GET items in users cart, look in the users collection. Find id that matches user id in URL.
  if (!user) return res.status(404).json('Could not find user'); // if user does not exist from previous query above line
  const products = await db.collection('products').find({}).toArray(); // GET all products from db
  const cartItemIds = user.cartItems; // set variable equal to cartItems array in the user collection for that particular user
  const cartItems = cartItemIds.map(id => // iterate over the cart item ids and match them with the product IDs in the products collection
    products.find(product => product.id === id)
  ); // map cart item IDs over to actual product names
  res.status(200).json(cartItems);   // 200 OK status for client, .json is like .send but spefically for json objects. Pass cart items array above. Can use fake ID for testing.
  client.close();
});

app.get('/api/products/:productId', async (req, res) => {    // URLs for all end points starts with API. GETs product details for specific product.
  const { productId } = req.params  // get ID URL param
  const client = await MongoClient.connect(             // establish a client connection via MongoClient imported above
    process.env.MONGO_USER && process.env.MONGO_PASS    // check to see if env variables exist, if so, run mongdo atlas connection, if not run on localhost connection
    ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.agwpl.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority` // First argument passed to connect is the localhost mongodb and port
    : 'mongodb://localhost:27017',                        // First argument passed to connect is the localhost mongodb and port
    { useNewUrlParser: true, useUnifiedTopology: true} // Configuration object, comptability items that have to be passed to mongo connection
  );
  const db = client.db(process.env.MONGO_DBNAME || 'vue-db-still');   // set variable equal to name of the db you want to connect to
  const product = await db.collection('products').findOne({ id: productId });
  if (product) {
    res.status(200).json(product); // if found, return the product in the response
  } else {
    res.status(404).json('Could not find the product.'); // if not found, return error message
  }
  client.close();
});

app.post('/api/users/:userId/cart', async (req, res) => {  // ADD ITEMS TO CART, test in Postman with post of raw data as JSON
  const { userId } = req.params; // Pull the userId from the URL params
  const { productId } = req.body; // pull the product ID out of the request body sent by the user to add to cart
  const client = await MongoClient.connect(             // establish a client connection via MongoClient imported above
    process.env.MONGO_USER && process.env.MONGO_PASS    // check to see if env variables exist, if so, run mongdo atlas connection, if not run on localhost connection
    ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.agwpl.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority` // First argument passed to connect is the localhost mongodb and port
    : 'mongodb://localhost:27017',                        // First argument passed to connect is the localhost mongodb and port
    { useNewUrlParser: true, useUnifiedTopology: true} // Configuration object, comptability items that have to be passed to mongo connection
  );
  const db = client.db(process.env.MONGO_DBNAME || 'vue-db-still');   // set variable equal to name of the db you want to connect to
  await db.collection('users').updateOne({ id: userId }, {   // pass two arguments here, one for userId, second is object for commits to the user
    $addToSet: { cartItems: productId }, // add new product ID to the users cart items
  });
  const user = await db.collection('users').findOne({ id: userId }); // get updated user 
  const products = await db.collection('products').find({}).toArray(); // get all products
  const cartItemIds = user.cartItems; // get cart items IDs
  const cartItems = cartItemIds.map(id => // iterate over the cart item ids and match them with the product IDs in the products collection
    products.find(product => product.id === id)
  ); // map cart item IDs over to actual product names

  res.status(200).json(cartItems); // send back updated cart items
  client.close();
});

app.delete('/api/users/:userId/cart/:productId', async (req, res) => {  // REMOVE ITEMS FROM CART, test in Postman Delete - http://localhost:8000/api/users/12345/cart/123
  const { userId, productId } = req.params;  // pull the product ID from the URL
  const client = await MongoClient.connect(             // establish a client connection via MongoClient imported above
    process.env.MONGO_USER && process.env.MONGO_PASS    // check to see if env variables exist, if so, run mongdo atlas connection, if not run on localhost connection
    ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.agwpl.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority` // First argument passed to connect is the localhost mongodb and port
    : 'mongodb://localhost:27017',                        // First argument passed to connect is the localhost mongodb and port
    { useNewUrlParser: true, useUnifiedTopology: true} // Configuration object, comptability items that have to be passed to mongo connection
  );
  const db = client.db(process.env.MONGO_DBNAME || 'vue-db-still');   // set variable equal to name of the db you want to connect to

  await db.collection('users').updateOne({ id: userId }, {   // pass two arguments here, one for userId, second is object for commits to the user
    $pull: { cartItems: productId }, // pull item from cart
  });
  const user = await db.collection('users').findOne({ id: userId }); // get updated user. 
  const products = await db.collection('products').find({}).toArray(); // get all products
  const cartItemIds = user.cartItems; // get users cartItems
  const cartItems = cartItemIds.map(id => // iterate over the cart item ids and match them with the product IDs in the products collection
    products.find(product => product.id === id)
  ); // map cart item IDs over to actual product names

  res.status(200).json(cartItems); // return updated cart items
  client.close();
});

// Test end points above in Postman by http://localhost:8000/api/products OR http://localhost:8000/api/users/1234/cart

app.get('*', (req, res) => {    // all the routes not handled by api are directed to the index.html inside the dist folder
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});  

app.listen(process.env.PORT || 8000, () => {  // tell server to listen on a specific port
    console.log('Server is listening on port 8000');
});