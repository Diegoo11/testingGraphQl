/* eslint-disable import/extensions */
import { gql, ApolloServer, UserInputError } from 'apollo-server';
import './db.js';
import Person from './models/person.js';
/*
const persons = [
  {
    name: 'midu',
    phone: '044-1234',
    street: 'calle frontend',
    city: 'barcelona',
    id: '123naie12n31oibvo1io231',
  },
  {
    name: 'hola',
    phone: '012144-123234',
    street: 'calle frontend',
    city: 'arquipa',
    id: '90879213io1io231',
  },
  {
    name: 'xd',
    phone: '12310144-1234',
    street: 'calle hola',
    city: 'tokyo',
    id: 'oiujb5ujb123',
  },
]; */

const typeDefs = gql`
  enum YesNo {
    YES
    NO 
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
  },
  Person: {
    address: (root) => `${root.street}, ${root.city}`,
    direccion: (root) => ({
      street: root.street,
      city: root.city,
    }),
  },
  Mutation: {
    addPerson: (root, args) => {
      const person = new Person({ ...args });
      try {
        return person.save();
      } catch {
        throw new UserInputError('El usuario no se pudo registrar');
      }
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
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server
  .listen()
  // eslint-disable-next-line no-console
  .then(({ url }) => console.log(`Server is running on ${url}`));
