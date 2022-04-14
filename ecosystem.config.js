module.exports = {
  apps : [{
      name: 'localport',
    script: 'index.js',
    watch: true,
    watch_options: {
        usePolling: true,
    }
}],

  deploy : {
    production : {
      user : 'ubuntu',
      host : ['35.154.4.141'],
      ref  : 'origin/servertest',
      repo : 'https://github.com/nikhilsn/localport_alter_backend.git',
      path : '/home/ubuntu/localport_alter/localport_alter_backend/',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
