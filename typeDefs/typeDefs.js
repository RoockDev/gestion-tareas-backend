import {gql} from 'graphql-tag';

const typeDefs = gql`

  
  type Task {
    id: ID!
    description: String
    duration: Int
    difficulty: String
    status: String
    assignedTo: User 
  }

  
  type User {
    id: ID
    name: String
    email: String
    roles: [String]
  }

  
  type Query {
    
    
     
    getTasksByDifficulty(difficulty: String!): [Task]

     
    getUnassignedTasks: [Task]


    
   
    getTasksByUserId(userId: ID!): [Task]

   
    getTasksByUserAndDifficulty(userId: ID!, difficulty: String!): [Task]
  }
`

export default typeDefs;