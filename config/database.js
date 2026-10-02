const mongoose =  require('mongoose');
require('dotenv').config();

const connectDB = async() => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conexao com o mongoDB estabelecida com sucesso');
    }catch(error){
        console.log('Erro ao conectar ao mongoDB', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;

