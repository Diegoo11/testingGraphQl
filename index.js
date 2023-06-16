import { gql, ApolloServer, UserInputError } from 'apollo-server';
import { v1 as uuid } from 'uuid';

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
];

const typeDefs = gql`
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
    allPersons: [Person]!
    findPerson(name: String!): Person
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
  }
`;

const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: () => persons,
    findPerson: (root, args) => {
      const { name } = args;
      return persons.find((person) => person.name === name);
    },
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
      if (persons.find((p) => p.name === args.name)) {
        throw new UserInputError('The user is alredy registered', {
          invalidArgs: args.name,
        });
      }
      const person = { ...args, id: uuid() };
      persons.push(person);
      return person;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server
  .listen()
  .then(({ url }) => console.log(`Server is running on ${url}`));
