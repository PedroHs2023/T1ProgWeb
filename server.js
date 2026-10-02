const express = require('express');
const { engine } = require('express-handlebars');
const connectDB = require('./config/database');
const agendaRoutes = require('./routes/agendaRoutes');

const app = express();

app.engine('handlebars', engine({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('home', {
        title: 'Pet Shop na Web'
    });
});

app.use('/', agendaRoutes);

const clienteRoutes = require('./routes/clienteRoutes');
app.use('/', clienteRoutes);

const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error('Falha critica ao iniciar o servidor:', error.message);
        process.exit(1);
    }
};

startServer();