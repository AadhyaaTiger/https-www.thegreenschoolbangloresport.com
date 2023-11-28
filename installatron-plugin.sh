#!/bin/sh

umask 022;
OS=`uname`;
M1=data.installatron.com;

if [ -e /var/installatron/custompanel ]; then
	echo "Error: Installatron Server is installed on this system."
	echo
	echo "If you know what you're doing, execute the below command, then re-execute this script."
	echo
	echo "rm -fr /var/installatron/custompanel"
	echo
	echo "Contact Installatron Support with any questions:"
        echo "https://installatron.com/contact"
	exit;
fi;

if [ -e /usr/local/installatron/bin/run ]; then
	PHP=/usr/local/installatron/bin/run
elif [ -e /usr/local/installatron/php/bin/php ]; then
	PHP=/usr/local/installatron/php/bin/php
elif [ -e /usr/local/interworx/bin/php ]; then 
	PHP=/usr/local/interworx/bin/php
elif [ -e /usr/local/cpanel/3rdparty/bin/php ]; then
        PHP=/usr/local/cpanel/3rdparty/bin/php
elif [ -e /usr/local/php74/bin/php74 ]; then
        PHP=/usr/local/php74/bin/php74
elif [ -e /usr/bin/php7.4 ]; then
	PHP=/usr/bin/php7.4
elif [ -e /usr/local/php81/bin/php ]; then
	PHP=/usr/local/php81/bin/php
elif [ -e /usr/bin/php8.1 ]; then
	PHP=/usr/bin/php8.1
elif [ -e /opt/plesk/php/7.4/bin/php ]; then
	PHP=/opt/plesk/php/7.4/bin/php
elif [ -e /opt/plesk/php/7.3/bin/php ]; then
	PHP=/opt/plesk/php/7.3/bin/php
elif [ -e /opt/plesk/php/8.1/bin/php ]; then
	PHP=/opt/plesk/php/8.1/bin/php
elif [ -e /usr/local/bin/php ]; then
	PHP=/usr/local/bin/php
elif [ -e /usr/bin/php ]; then
	PHP=/usr/bin/php
else
	echo "Error: PHP not installed.";
	echo
	echo "Execute the commands at the following URL to install an instance of PHP, and then re-execute this script."
	echo "https://installatron.com/docs/admin/troubleshooting#nophp";
	echo
	echo "Contact Installatron Support with any questions:"
	echo "https://installatron.com/contact"
	exit;
fi

INSECURE=0;
for w; do if [ "$w" = "--no-check-certificate" ]; then INSECURE=1; break; fi; done;

if [ "$OS" = "FreeBSD" ]; then
	FETCHER="fetch -o "
else
	if [ $INSECURE -eq 1 ]; then
		FETCHER="/usr/bin/wget -nv -T 3 -t 1 --no-check-certificate -O "
	else
		FETCHER="/usr/bin/wget -nv -T 3 -t 1 -O "
	fi
fi

if [ ! -e /usr/local/installatron/etc/php.ini ]; then
	mkdir -p /usr/local/installatron/etc
	$FETCHER /usr/local/installatron/etc/php.ini https://$M1/php.ini
fi

$FETCHER /usr/local/installatron/etc/repair https://$M1/repair
$PHP -n -c /usr/local/installatron/etc/php.ini -q /usr/local/installatron/etc/repair -- $* 2>/dev/null || $PHP -q /usr/local/installatron/etc/repair -- $*
