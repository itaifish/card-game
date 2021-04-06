/* eslint-disable @typescript-eslint/ban-types,@typescript-eslint/no-empty-function */
import SocketIO from "socket.io";

export default class DummySocket implements SocketIO.Socket {
    adapter: SocketIO.Adapter;
    broadcast: SocketIO.Socket;
    client: SocketIO.Client;
    conn: SocketIO.EngineSocket;
    connected: boolean;
    disconnected: boolean;
    handshake: SocketIO.Handshake;
    id: string;
    json: SocketIO.Socket;
    nsp: SocketIO.Namespace;
    request: any;
    rooms: { [p: string]: string };
    server: SocketIO.Server;
    volatile: SocketIO.Socket;

    addListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return undefined;
    }

    compress(compress: boolean): SocketIO.Socket {
        return undefined;
    }

    disconnect(close?: boolean): SocketIO.Socket {
        return undefined;
    }

    emit(event: string | symbol, ...args: any[]): boolean {
        return false;
    }

    error(err: any): void {}

    eventNames(): Array<string | symbol> {
        return undefined;
    }

    getMaxListeners(): number {
        return 0;
    }

    in(room: string): SocketIO.Socket {
        return undefined;
    }

    join(name: string | string[], fn?: (err?: any) => void): SocketIO.Socket {
        return undefined;
    }

    leave(name: string, fn?: Function): SocketIO.Socket {
        return undefined;
    }

    leaveAll(): void {}

    listenerCount(type: string | symbol): number {
        return 0;
    }

    listeners(event: string): Function[];
    listeners(event: string | symbol): Function[];
    listeners(event: string | symbol): Function[] {
        return [];
    }

    off(event: string | symbol, listener: (...args: any[]) => void): this {
        return undefined;
    }

    on(event: string | symbol, listener: (...args: any[]) => void): this {
        return undefined;
    }

    once(event: string | symbol, listener: (...args: any[]) => void): this {
        return undefined;
    }

    prependListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return undefined;
    }

    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return undefined;
    }

    rawListeners(event: string | symbol): Function[] {
        return [];
    }

    removeAllListeners(event?: string | symbol): this {
        return undefined;
    }

    removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return undefined;
    }

    send(...args: any[]): SocketIO.Socket {
        return undefined;
    }

    setMaxListeners(n: number): this {
        return undefined;
    }

    to(room: string): SocketIO.Socket {
        return undefined;
    }

    use(fn: (packet: SocketIO.Packet, next: (err?: any) => void) => void): SocketIO.Socket {
        return undefined;
    }

    write(...args: any[]): SocketIO.Socket {
        return undefined;
    }
}
