module.exports = {
  apps : [{
    name: 'lie',
    script: 'server.js',
    cwd: './backend'
  }],
  deploy :{
     production : {
      user: 'ubuntu',
      host:'ec2-18-223-190-44.us-east-2.compute.amazonaws.com',
      key: 'C:/Users/Administrador/Downloads/UTN/PF/Keys_ec2/softwarelie.pem',
      ref: 'origin/testpm2',
      repo : 'git@github.com:AFascioli/Lie.git',
      path : '/home/ubuntu',
      'post-deploy' : 'npm install ./proyectoicr && pm2 startOrRestart ecosystem.config.js'
    }
  }
};
