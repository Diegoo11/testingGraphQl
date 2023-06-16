const { ApolloServer } = require('apollo-server');

const morgan = require('morgan');


morgan()


const typeDefs = `
  type Query {
    info: String!
  }
`;

const resolvers = {
  Query: {
    info: () => "This is the API of a HAcker"
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

server
  .listen()
  .then(({ url }) => console.log(`Server is running on ${url}`))

  