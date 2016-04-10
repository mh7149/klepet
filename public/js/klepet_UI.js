function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  var slike = pridobiPovezaveSlik(sporocilo);
  var youtubePosnetki = pridobiYoutubePovezave(sporocilo);
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz({sporocilo: sporocilo, slike: slike, youtubePosnetki: youtubePosnetki});
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo.besedilo));
      for (var i in sistemskoSporocilo.slike) {
        $('#sporocila').append("<img class=\"slika\" src=\"" + sistemskoSporocilo.slike[i] + "\">");
      }
      for (var i in sistemskoSporocilo.youtubePosnetki) {
        $('#sporocila').append("<iframe class=\"youtube-posnetki\" src=\"https://www.youtube.com/embed/" + sistemskoSporocilo.youtubePosnetki[i] + "\" allowfullscreen></iframe>");
      }
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, {sporocilo: sporocilo, slike: slike, youtubePosnetki: youtubePosnetki});
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    for (var i in slike) {
      $('#sporocila').append("<img class=\"slika\" src=\"" + slike[i] + "\">");
    }
    for (var i in youtubePosnetki) {
      $('#sporocila').append("<iframe class=\"youtube-posnetki\" src=\"https://www.youtube.com/embed/" + youtubePosnetki[i] + "\" allowfullscreen></iframe>");
    }
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    for (var i in sporocilo.slike) {
      $('#sporocila').append("<img class=\"slika\" src=\"" + sporocilo.slike[i] + "\">");
    }
    for (var i in sporocilo.youtubePosnetki) {
      $('#sporocila').append("<iframe class=\"youtube-posnetki\" src=\"https://www.youtube.com/embed/" + sporocilo.youtubePosnetki[i] + "\" allowfullscreen></iframe>");
    }
  });
  
  socket.on('dregljaj', function (dregljaj) {
    if (dregljaj.dregljaj) {
      $('#vsebina').jrumble();
      $('#vsebina').trigger('startRumble');
      setTimeout(function() {
        $('#vsebina').trigger('stopRumble');
      }, 1500);
    }
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
      $('#poslji-sporocilo').val('/zasebno \"' + $(this).text() + '\" ');
      $('#poslji-sporocilo').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function pridobiPovezaveSlik(vhodnoBesedilo) {
  return vhodnoBesedilo.match(/(https?:\/\/\S*\.(?:jpg|png|gif))/g);
}

function pridobiYoutubePovezave(vhodnoBesedilo) {
  var videos = vhodnoBesedilo.match(/https:\/\/www\.youtube\.com\/watch\?v=(:?\S+)/g);
  for (var i in videos) {
    videos[i] = videos[i].match(/(?:https:\/\/www\.youtube\.com\/watch\?v=(\S+))/)[1];
  }
  return videos;
}

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
