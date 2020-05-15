module.exports = {
  apps : [{
    name: 'lie',
    script: 'server.js',
    cwd: './lie/proyectoicr/backend'
  }],
  deploy :{
     production : {
      user: 'ubuntu',
      host:'ec2-18-223-190-44.us-east-2.compute.amazonaws.com',
      key: '~/.ssh/authorized_keys',
      ref: 'origin/testpm2',
      repo : 'git@github.com:AFascioli/Lie.git',
      path : '.',
      'post-deploy' : 'npm install && pm2 startOrRestart ecosystem.config.js'
    }
  }
};