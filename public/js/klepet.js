var Klepet = function(socket) {
  this.socket = socket;
};

Klepet.prototype.posljiSporocilo = function(kanal, besedilo, youtubePosnetki) {
  var sporocilo = {
    kanal: kanal,
    besedilo: besedilo,
    youtubePosnetki: youtubePosnetki
  };
  this.socket.emit('sporocilo', sporocilo);
};

Klepet.prototype.spremeniKanal = function(kanal) {
  this.socket.emit('pridruzitevZahteva', {
    novKanal: kanal
  });
};

Klepet.prototype.procesirajUkaz = function(ukaz, youtubePosnetki) {
  var besede = ukaz.split(' ');
  ukaz = besede[0].substring(1, besede[0].length).toLowerCase();
  var sporocilo = false;

  switch(ukaz) {
    case 'pridruzitev':
      besede.shift();
      var kanal = besede.join(' ');
      this.spremeniKanal(kanal);
      break;
    case 'vzdevek':
      besede.shift();
      var vzdevek = besede.join(' ');
      this.socket.emit('vzdevekSpremembaZahteva', vzdevek);
      break;
    case 'zasebno':
      besede.shift();
      var besedilo = besede.join(' ');
      var parametri = besedilo.split('\"');
      if (parametri) {
        this.socket.emit('sporocilo', { vzdevek: parametri[1], besedilo: parametri[3], youtubePosnetki: youtubePosnetki });
        sporocilo = {besedilo: '(zasebno za ' + parametri[1] + '): ' + parametri[3], youtubePosnetki: youtubePosnetki};
      } else {
        sporocilo = {besedilo: 'Neznan ukaz', youtubePosnetki: null};
      }
      break;
    default:
      sporocilo = {besedilo: 'Neznan ukaz', youtubePosnetki: null};
      break;
  };

  return sporocilo;
};
