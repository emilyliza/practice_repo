# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.hostname = "chargeback"

  config.vm.network "forwarded_port", guest: 80, host: 8080
  
  config.vm.network "private_network", ip: "10.0.0.100", virtualbox__inet: true

  config.vm.provision "shell", path: "./build-python-env.sh"
end
