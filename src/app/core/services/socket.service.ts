import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | undefined;
  
  // Usamos un Subject para emitir notificaciones
  private notificationSubject = new Subject<any>();
  public notifications$ = this.notificationSubject.asObservable();

  constructor() {}

  connect(userId: number) {
    this.socket = io(environment.socketUrl);

    this.socket.on('connect', () => {
      console.log('🔗 Conectado a WebSockets', this.socket?.id);
      // Registramos el usuario en el socket
      this.socket?.emit('registerUser', userId);
    });

    this.socket.on('nueva-notificacion', (data: any) => {
      console.log('🔔 Notificación recibida:', data);
      this.notificationSubject.next(data);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado de WebSockets');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  enviarNotificacionLocal(titulo: string, mensaje: string) {
    this.notificationSubject.next({
      titulo,
      mensaje,
      fecha: new Date().toISOString()
    });
  }
}
