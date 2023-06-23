/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
import {
  gql, ApolloServer, UserInputError, AuthenticationError,
} from 'apollo-server';
import './db.js';
import jwt from 'jsonwebtoken';
import Person from './models/person.js';
import User from './models/User.js';

const SECRET = 'MI_PALABRA_SECRETA_DE_JSONWEBTOKEN';

const typeDefs = gql`
  enum YesNo {
    YES
    NO 
  }

  type User {
    username: String!
    friends: [Person]!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Person {
    name: String!
    phone: String
    street: String!
    city: String!
    id: ID!
    address: String!
    direccion: Direccion
  }

  type Direccion {
    street: String!
    city: String!
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
    me: User
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person

    editPhone(
      name: String!
      phone: String!
    ): Person

    createUser(
      username: String!
    ): User

    loginUser(
      username: String!
      password: String!
    ): Token

    addAsFriend(
      name: String!
    ): User
  }
`;

const resolvers = {
  Query: {
    personCount: async () => Person.collection.countDocuments(),
    allPersons: async (root, args) => {
      if (!args.phone) {
        return Person.find({});
      }
      return Person.find({ phone: { $exists: args.phone === 'YES' } });
    },
    findPerson: async (root, args) => Person.findOne({ name: args.name }),
    me: (root, args, context) => context.currentUser,
  },
  Person: {
    address: (root) => `${root.street}, ${root.city}`,
    direccion: (root) => ({
      street: root.street,
      city: root.city,
    }),
  },
  Mutation: {
    addPerson: async (root, args, context) => {
      const { currentUser } = context;
      if (!currentUser) throw new AuthenticationError('Not Authenticated');
      const person = new Person({ ...args });
      try {
        await person.save();
        currentUser.friends = currentUser.friends.concat(person);
        currentUser.save();
      } catch {
        throw new UserInputError('El usuario no se pudo registrar');
      }
      return person;
    },
    editPhone: async (root, { name, phone }) => {
      const person = await Person.findOne({ name });
      if (!person) {
        throw new UserInputError('usuario equivocado');
      }
      person.phone = phone;
      try {
        return await person.save();
      } catch {
        throw new UserInputError('No se pudo guardar al Person');
      }
    },
    createUser: (root, args) => {
      const user = new User({ username: args.username });
      return user.save().catch((error) => {
        throw new UserInputError(
          error.message,
          { invalidArgs: args },
        );
      });
    },
    loginUser: async (root, { username, password }) => {
      const user = await User.findOne({ username });

      if (!user || password !== 'psw') {
        throw new AuthenticationError('wrong credentials');
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return {
        value: jwt.sign(userForToken, SECRET),
      };
    },
    addAsFriend: async (root, args, context) => {
      const { currentUser } = context;
      if (!currentUser) throw new AuthenticationError('Not Authenticated');

      const person = await Person.findOne({ name: args.name });
      const friendVerify = (prs) => !currentUser.friends
        .map((p) => JSON.stringify(p._id))
        .includes(JSON.stringify(prs._id));
      if (!person || !friendVerify(person)) {
        throw new UserInputError('Usuario no encontrado o ya es un amigo', {
          invalidArgs: args,
        });
      }
      currentUser.friends = currentUser.friends.concat(person);
      await currentUser.save();
      return currentUser;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // eslint-disable-next-line consistent-return
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const tk = auth.substring(7);
      const decodedToken = jwt.decode(tk, SECRET);

      if (!decodedToken) throw new AuthenticationError('Wrong credentials');

      const { id } = decodedToken;

      const currentUser = await User.findById(id).populate('friends');
      return { currentUser };
    }
  },
});

server
  .listen()
  .then(({ url }) => console.log(`Server is running on ${url}`));
