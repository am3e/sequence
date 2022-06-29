data "aws_availability_zones" "available" {}

data "aws_route53_zone" "zone" {
  name = "am3e.dev"
}

data "aws_route53_zone" "primary" {
  name         = "am3e.dev"
}