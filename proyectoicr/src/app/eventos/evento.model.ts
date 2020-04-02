export interface Evento {
  _id: string;
  titulo: string;
  descripcion: string;
  fechaEvento: Date;
  horaInicio: string;
  horaFin: string;
  tags: string[];
  autor: string;
  filenames: any;
  comentarios: string[];
}
