const AWS = require('aws-sdk');

// Configure AWS region
AWS.config.update({region: 'us-west-2'});

// Create DynamoDB service object
const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function createTable() {
    const params = {
        TableName : "ExampleTable",
        KeySchema: [       
            { AttributeName: "id", KeyType: "HASH"},  
        ],
        AttributeDefinitions: [       
            { AttributeName: "id", AttributeType: "S" },
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 1, 
            WriteCapacityUnits: 1
        }
    };

    try {
        const dynamoDBRaw = new AWS.DynamoDB();
        const data = await dynamoDBRaw.createTable(params).promise();
        console.log("Table Created", data);
    } catch (err) {
        console.error("Unable to create table. Error:", JSON.stringify(err, null, 2));
    }
}

async function insertItem() {
    const params = {
        TableName: 'ExampleTable',
        Item: {
            'id': '1',
            'info': {
                'name': 'John Doe',
                'age': 30
            }
        }
    };

    try {
        const data = await dynamoDB.put(params).promise();
        console.log("Item inserted successfully", data);
    } catch (err) {
        console.error("Unable to insert item. Error:", JSON.stringify(err, null, 2));
    }
}

async function getItem() {
    const params = {
        TableName: 'ExampleTable',
        Key: {
            'id': '1'
        }
    };

    try {
        const data = await dynamoDB.get(params).promise();
        console.log("Retrieved item:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Unable to retrieve item. Error:", JSON.stringify(err, null, 2));
    }
}

// Run the examples
async function runExamples() {
    // Uncomment the line below to create a table. Note: Table creation can take some time.
    // await createTable(); 
    
    // Wait for the table to be created before inserting and getting items.
    // You might want to use a more sophisticated method to check if the table is ready.
    await insertItem();
    await getItem();
}

runExamples();
