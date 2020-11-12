#!/usr/bin/perl

while(<>) {
  if(m|/\*([^*]*)\*/|) {
    my $comment=$1;
    $isLatin=$comment=~/latin/;
  }
  if($isLatin) {
    if(s|([^\(]+/([^\)]+\.woff2))|$2|) {
      my ($font,$url)=($2,$1);
      my $cmd="wget $url";
      `wget -nc $url 2> /dev/null`;
      if($?) {die "Failed to download $font from $url\n";}
    }
    print;
  }
}
