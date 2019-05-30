// id esta definido por mongo
export interface Estudiante {
  id: string;
  apellido: string;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: number;
  cuil: number;
  sexo: string;
  calle: string;
  numeroCalle: number;
  piso: string;
  departamento: string;
  provincia: string;
  localidad: string;
  codigoPostal: number;
  nacionalidad: string;
  provinciaNacimiento: string;
  localidadNacimiento: string;
  fechaNacimiento: Date;
  estadoCivil: string;
  telefonoFijo: number;
  adultoResponsable: [];
}
