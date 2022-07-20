{ pkgs ? import <nixpkgs> { } }:

pkgs.stdenvNoCC.mkDerivation {
  name = "dev-shell";
  buildInputs = with pkgs; [ nodejs_latest ];
  nativeBuildInputs = with pkgs; [ ];
}
