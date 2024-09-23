import {
    Application,
    json,
    urlencoded,
    Response,
    Request,
    NextFunction,
    application,
} from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import cookierSession from "cookie-session";
import HTTP_STATUS from "http-status-codes";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import compression from 'compression'
import "express-async-errors";
import { config } from "./config";

const SERVER_PORT = 5000;

export class ChattyServer {
    private app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    public start(): void {
        this.securityMiddleware(this.app);
        this.standardMiddleware(this.app);
        this.routeMiddleware(this.app);
        this.globalErrorHandler(this.app);
        this.startServer(this.app);
    }

    private securityMiddleware(app: Application): void {
        app.use(
            cookierSession({
                name: "session",
                keys: ["text1", "test2"],
                maxAge: 24 * 7 * 360000,
                secure: false,
            })
        );
        app.use(hpp());
        app.use(helmet());
        app.use(
            cors({
                origin: '*',
                credentials: true,
                optionsSuccessStatus: 200,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
            })
        );
    }

    private standardMiddleware(app: Application): void {
        app.use(compression());
        app.use(json({ limit: '50mb'}));
        app.use(urlencoded({ extended: true, limit: '50mb'}));
    }

    private routeMiddleware(app: Application): void { }

    private globalErrorHandler(app: Application): void { }

    private async startServer(app: Application): Promise<void>{
        try {
            const httpServer: http.Server = new http.Server(app);
            const socketIO: Server = await this.createSocketIO(httpServer);
            this.startHttpServer(httpServer);
            this.socketIOConnections(socketIO);
        } catch (error) {
            console.log(error);
        }
    }

    private async createSocketIO(httpServer: http.Server): Promise<Server> { 
        const io: Server = new Server(httpServer, {
            cors: {
                origin: config.CLIENT_URL,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] 
            }
        });
        const publicClient = createClient({url: config.REDIS_HOST});
        const subClient = publicClient.duplicate();
        await Promise.all([publicClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(publicClient, subClient));
        return io;
    }

    private startHttpServer(httpServer: http.Server): void {
        console.log(`Server has started with process ${process.pid}`)
        httpServer.listen(SERVER_PORT, () => {
            console.log(`Server running on port ${SERVER_PORT}`);
        })
    }

    private socketIOConnections(io: Server): void {}
}
