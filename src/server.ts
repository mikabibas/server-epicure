import { config } from './config/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import Logging from './library/Logging';
import chefRoutes from './routes/Chef';
import restaurantRoutes from './routes/Restaurant';
import dishRoutes from './routes/Dish';
import connectToDatabase from './connections/dbConnection';

const app = express();

connectToDatabase()
    .then(() => {
        StartServer();
    })
    .catch((error) => {
        Logging.error('Unable to start server');
        Logging.error(error);
    });

const StartServer = () => {
    app.use((req, res, next) => {
        Logging.info(`Incoming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);

        res.on('finish', () => {
            Logging.info(`Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - STATUS: [${res.statusCode}]`);
        });

        next();
    });

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

        if (req.method == 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
            return res.status(200).json({});
        }

        next();
    });

    app.use('/api/restaurants', restaurantRoutes);
    app.use('/api/chefs', chefRoutes);
    app.use('/api/dishes', dishRoutes);

    app.use((req, res, next) => {
        const error = new Error('Not found');
        Logging.error(error);
        next(error);
    });

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        Logging.error(err);
        const statusCode = (err as any).status || 500;
        res.status(statusCode).json({
            message: err.message || 'Internal Server Error'
        });
    });

    http.createServer(app).listen(config.server.port, () => Logging.info(`Server is running on port ${config.server.port}`));
};
