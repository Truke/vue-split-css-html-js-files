// rsa加密
export default  {
	rsaEncrypted:function(str){
	    var rsa_pub = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCo5ABEksJqFM0G2/tOdvBsqr1iPfzPUWCa6rmzgq0zZQN1L6t6t3chdnmsPpt8lXywwjppa4uVpvQ0Tm5AGwaKJLIcU/k6JYIQrX11kgNENHSn+/0i5fOm4RHcKibCipJgxNoWSsnkYebUbap2jZWgxUFbLqmVyaywjhCZJGGNAwIDAQAB";
	    var encrypt = new JSEncrypt();
	  	encrypt.setPublicKey(rsa_pub);
		 	return encrypt.encrypt(str);

	}
}
