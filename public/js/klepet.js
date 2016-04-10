var Klepet = function(socket) {
  this.socket = socket;
};

Klepet.prototype.posljiSporocilo = function(kanal, besedilo) {
  var sporocilo = {
    kanal: kanal,
    besedilo: besedilo.sporocilo,
    slike: besedilo.slike,
    youtubePosnetki: besedilo.youtubePosnetki
  };
  this.socket.emit('sporocilo', sporocilo);
};

Klepet.prototype.spremeniKanal = function(kanal) {
  this.socket.emit('pridruzitevZahteva', {
    novKanal: kanal
  });
};

Klepet.prototype.procesirajUkaz = function(ukaz) {
  var slike = ukaz.slike;
  var youtubePosnetki = ukaz.youtubePosnetki;
  var besede = ukaz.sporocilo.split(' ');
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
        this.socket.emit('sporocilo', { vzdevek: parametri[1], besedilo: parametri[3], slike: slike, youtubePosnetki: youtubePosnetki});
        sporocilo = {besedilo: '(zasebno za ' + parametri[1] + '): ' + parametri[3], slike: slike, youtubePosnetki: youtubePosnetki};
      } else {
        sporocilo = {besedilo: 'Neznan ukaz', slike: null, youtubePosnetki: null};
      }
      break;
    default:
      sporocilo = {besedilo: 'Neznan ukaz.', slike: null, youtubePosnetki: null};
      break;
  };

  return sporocilo;
};
